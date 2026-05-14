#!/usr/bin/env python3

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


DEFAULT_BASE_URL = "https://sandbox-api.summation.com"


def base_url() -> str:
    return os.getenv("SUM_API_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


def json_dumps(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=True)


def parse_json_arg(raw: str | None, default: Any) -> Any:
    if raw is None or raw == "":
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON argument: {exc}") from exc


def request_json(
    method: str,
    path_or_url: str,
    *,
    headers: dict[str, str] | None = None,
    body: Any = None,
    query: dict[str, Any] | None = None,
) -> Any:
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        url = path_or_url
    else:
        path = path_or_url if path_or_url.startswith("/") else f"/{path_or_url}"
        url = f"{base_url()}{path}"

    if query:
        clean_query = {
            key: str(value)
            for key, value in query.items()
            if value is not None
        }
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}{urllib.parse.urlencode(clean_query)}"

    data = None
    request_headers = {"Accept": "application/json"}
    if headers:
        request_headers.update(headers)
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=request_headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read()
            if not raw:
                return None
            content_type = response.headers.get("Content-Type", "")
            if "json" not in content_type:
                return raw.decode("utf-8", errors="replace")
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw)
        except json.JSONDecodeError:
            detail = raw
        raise SystemExit(json_dumps({
            "error": {
                "status": exc.code,
                "reason": exc.reason,
                "body": detail,
            }
        })) from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Request failed: {exc}") from exc


def fetch_openapi() -> dict[str, Any]:
    return request_json("GET", "/openapi.json")


def exchange_m2m_token() -> str:
    client_id = os.getenv("SUM_API_CLIENT_ID")
    client_secret = os.getenv("SUM_API_CLIENT_SECRET")
    scope = os.getenv("SUM_API_M2M_SCOPE")
    if not client_id or not client_secret:
        raise SystemExit("Set SUM_API_ACCESS_TOKEN or SUM_API_CLIENT_ID and SUM_API_CLIENT_SECRET")

    body: dict[str, Any] = {
        "client_id": client_id,
        "client_secret": client_secret,
    }
    if scope:
        body["scope"] = scope

    response = request_json("POST", "/v1/auth/m2m/token", body=body)
    token = response.get("access_token") if isinstance(response, dict) else None
    if not token:
        raise SystemExit("M2M token response did not include access_token")
    return token


def auth_headers(required: bool = True) -> dict[str, str]:
    token = os.getenv("SUM_API_ACCESS_TOKEN")
    if not token:
        token = exchange_m2m_token() if required else None
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


def iter_operations(spec: dict[str, Any]):
    for path, path_item in spec.get("paths", {}).items():
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete"}:
                continue
            if not isinstance(operation, dict):
                continue
            yield method.upper(), path, operation


def command_openapi(_: argparse.Namespace) -> None:
    print(json_dumps(fetch_openapi()))


def command_operations(args: argparse.Namespace) -> None:
    spec = fetch_openapi()
    needle = (args.search or "").lower()
    rows = []
    for method, path, operation in iter_operations(spec):
        haystack = " ".join([
            method,
            path,
            str(operation.get("operationId", "")),
            str(operation.get("summary", "")),
            " ".join(operation.get("tags", [])),
        ]).lower()
        if needle and needle not in haystack:
            continue
        rows.append({
            "method": method,
            "path": path,
            "operation_id": operation.get("operationId"),
            "tags": operation.get("tags", []),
            "summary": operation.get("summary"),
        })
    print(json_dumps(rows))


def find_operation(spec: dict[str, Any], operation_id: str) -> tuple[str, str, dict[str, Any]]:
    for method, path, operation in iter_operations(spec):
        if operation.get("operationId") == operation_id:
            return method, path, operation
    raise SystemExit(f"Operation not found: {operation_id}")


def fill_path(path: str, params: dict[str, Any]) -> str:
    filled = path
    for key, value in params.items():
        filled = filled.replace("{" + key + "}", urllib.parse.quote(str(value), safe=""))
    if "{" in filled or "}" in filled:
        raise SystemExit(f"Missing path parameter for {filled}")
    return filled


def operation_query_params(operation: dict[str, Any], params: dict[str, Any]) -> dict[str, Any]:
    query = {}
    for parameter in operation.get("parameters", []):
        if not isinstance(parameter, dict):
            continue
        if parameter.get("in") != "query":
            continue
        name = parameter.get("name")
        if name in params:
            query[name] = params[name]
    return query


def command_operation(args: argparse.Namespace) -> None:
    spec = fetch_openapi()
    method, path, operation = find_operation(spec, args.operation_id)
    params = parse_json_arg(args.params, {})
    body = parse_json_arg(args.body, None)
    response = request_json(
        method,
        fill_path(path, params),
        headers=auth_headers(),
        body=body,
        query=operation_query_params(operation, params),
    )
    print(json_dumps(response))


def command_call(args: argparse.Namespace) -> None:
    query = parse_json_arg(args.query, {})
    body = parse_json_arg(args.body, None)
    response = request_json(
        args.method,
        args.path,
        headers=auth_headers(),
        body=body,
        query=query,
    )
    print(json_dumps(response))


def command_token(_: argparse.Namespace) -> None:
    print(json_dumps({"access_token": exchange_m2m_token()}))


def command_doctor(_: argparse.Namespace) -> None:
    spec = fetch_openapi()
    result = {
        "base_url": base_url(),
        "openapi_title": spec.get("info", {}).get("title"),
        "openapi_version": spec.get("info", {}).get("version"),
        "path_count": len(spec.get("paths", {})),
        "has_access_token": bool(os.getenv("SUM_API_ACCESS_TOKEN")),
        "has_m2m_credentials": bool(os.getenv("SUM_API_CLIENT_ID") and os.getenv("SUM_API_CLIENT_SECRET")),
    }
    print(json_dumps(result))


def main() -> int:
    parser = argparse.ArgumentParser(description="Summation sum-api helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    openapi_parser = subparsers.add_parser("openapi", help="Fetch the live OpenAPI document")
    openapi_parser.set_defaults(func=command_openapi)

    operations_parser = subparsers.add_parser("operations", help="List OpenAPI operations")
    operations_parser.add_argument("search", nargs="?", help="Filter by method, path, tag, operationId, or summary")
    operations_parser.set_defaults(func=command_operations)

    operation_parser = subparsers.add_parser("operation", help="Call an operation by operationId")
    operation_parser.add_argument("operation_id")
    operation_parser.add_argument("--params", help="JSON object for path and query parameters")
    operation_parser.add_argument("--body", help="JSON request body")
    operation_parser.set_defaults(func=command_operation)

    call_parser = subparsers.add_parser("call", help="Call a method and path directly")
    call_parser.add_argument("method")
    call_parser.add_argument("path")
    call_parser.add_argument("--query", help="JSON object of query parameters")
    call_parser.add_argument("--body", help="JSON request body")
    call_parser.set_defaults(func=command_call)

    token_parser = subparsers.add_parser("token", help="Exchange M2M credentials for an access token")
    token_parser.set_defaults(func=command_token)

    doctor_parser = subparsers.add_parser("doctor", help="Check OpenAPI reachability and local auth inputs")
    doctor_parser.set_defaults(func=command_doctor)

    args = parser.parse_args()
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
