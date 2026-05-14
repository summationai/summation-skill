#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const skillSource = path.join(repoRoot, "skills", "summation");

function usage() {
  console.log(`summation-skill

Usage:
  summation-skill install [codex|claude|all]
  summation-skill doctor
  summation-skill where

Environment:
  CODEX_HOME                 Defaults to ~/.codex
  CLAUDE_HOME                Defaults to ~/.claude
  SUMMATION_SKILL_TARGET_DIR  Installs to an explicit custom skill directory
`);
}

function homeJoin(...parts) {
  return path.join(os.homedir(), ...parts);
}

function resolveTargets(kind) {
  if (process.env.SUMMATION_SKILL_TARGET_DIR) {
    return [
      {
        name: "custom",
        dir: path.resolve(process.env.SUMMATION_SKILL_TARGET_DIR),
      },
    ];
  }

  const codexHome = process.env.CODEX_HOME || homeJoin(".codex");
  const claudeHome = process.env.CLAUDE_HOME || homeJoin(".claude");
  const targets = {
    codex: [{ name: "codex", dir: path.join(codexHome, "skills", "summation") }],
    claude: [{ name: "claude", dir: path.join(claudeHome, "skills", "summation") }],
    all: [
      { name: "codex", dir: path.join(codexHome, "skills", "summation") },
      { name: "claude", dir: path.join(claudeHome, "skills", "summation") },
    ],
  };

  return targets[kind];
}

function copyRecursive(source, target) {
  const baseName = path.basename(source);
  if (baseName === "__pycache__" || baseName.endsWith(".pyc")) {
    return;
  }

  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  fs.copyFileSync(source, target);
  fs.chmodSync(target, stat.mode);
}

function install(kind) {
  const targets = resolveTargets(kind);
  if (!targets) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(skillSource)) {
    console.error(`Missing skill source: ${skillSource}`);
    process.exitCode = 1;
    return;
  }

  for (const target of targets) {
    fs.rmSync(target.dir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(target.dir), { recursive: true });
    copyRecursive(skillSource, target.dir);
    console.log(`Installed Summation skill for ${target.name}: ${target.dir}`);
  }
}

function printTargets() {
  for (const target of resolveTargets("all")) {
    console.log(`${target.name}: ${target.dir}`);
  }
}

function doctor() {
  const skillMd = path.join(skillSource, "SKILL.md");
  const helper = path.join(skillSource, "scripts", "sum_api.py");
  const checks = [
    ["package.json", path.join(repoRoot, "package.json")],
    ["SKILL.md", skillMd],
    ["helper", helper],
  ];

  let ok = true;
  for (const [name, filePath] of checks) {
    const exists = fs.existsSync(filePath);
    ok = ok && exists;
    console.log(`${exists ? "ok" : "missing"} ${name}: ${filePath}`);
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

const [command, target = "all"] = process.argv.slice(2);

switch (command) {
  case "install":
    install(target);
    break;
  case "where":
    printTargets();
    break;
  case "doctor":
    doctor();
    break;
  case undefined:
  case "help":
    usage();
    break;
  default:
    usage();
    process.exitCode = 1;
}
