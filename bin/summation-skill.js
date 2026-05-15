#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const skillSource = path.join(repoRoot, "skills", "summation");
const sharedSkillDir = path.join(os.homedir(), ".agents", "skills", "summation");

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
        link: false,
      },
    ];
  }

  const codexHome = process.env.CODEX_HOME || homeJoin(".codex");
  const claudeHome = process.env.CLAUDE_HOME || homeJoin(".claude");
  const targets = {
    codex: [{ name: "codex", dir: path.join(codexHome, "skills", "summation"), link: true }],
    claude: [{ name: "claude", dir: path.join(claudeHome, "skills", "summation"), link: true }],
    all: [
      { name: "codex", dir: path.join(codexHome, "skills", "summation"), link: true },
      { name: "claude", dir: path.join(claudeHome, "skills", "summation"), link: true },
    ],
  };

  return targets[kind];
}

function copyRecursive(source, target) {
  const baseName = path.basename(source);
  if (baseName === "__pycache__" || baseName.endsWith(".pyc") || baseName === ".summation-config") {
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

function readExistingConfig(targets) {
  for (const target of targets) {
    const configPath = path.join(target.dir, ".summation-config");
    if (fs.existsSync(configPath)) {
      return {
        content: fs.readFileSync(configPath),
        mode: fs.statSync(configPath).mode,
      };
    }
  }

  const sharedConfigPath = path.join(sharedSkillDir, ".summation-config");
  if (fs.existsSync(sharedConfigPath)) {
    return {
      content: fs.readFileSync(sharedConfigPath),
      mode: fs.statSync(sharedConfigPath).mode,
    };
  }

  return null;
}

function installSharedSkill(existingConfig) {
  fs.rmSync(sharedSkillDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(sharedSkillDir), { recursive: true });
  copyRecursive(skillSource, sharedSkillDir);
  if (existingConfig) {
    fs.writeFileSync(path.join(sharedSkillDir, ".summation-config"), existingConfig.content, { mode: existingConfig.mode });
  }
}

function createRelativeSymlink(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const realTargetParent = fs.realpathSync(path.dirname(target));
  const relativeSource = path.relative(realTargetParent, source);
  fs.symlinkSync(relativeSource, target, "dir");
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

  const existingConfig = readExistingConfig(targets);
  if (targets.some((target) => target.link)) {
    installSharedSkill(existingConfig);
  }

  for (const target of targets) {
    if (target.link) {
      createRelativeSymlink(sharedSkillDir, target.dir);
      console.log(`Installed Summation skill for ${target.name}: ${target.dir} -> ${fs.readlinkSync(target.dir)}`);
    } else {
      fs.rmSync(target.dir, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(target.dir), { recursive: true });
      copyRecursive(skillSource, target.dir);
      if (existingConfig) {
        fs.writeFileSync(path.join(target.dir, ".summation-config"), existingConfig.content, { mode: existingConfig.mode });
      }
      console.log(`Installed Summation skill for ${target.name}: ${target.dir}`);
    }
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
