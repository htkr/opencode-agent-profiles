import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const skillsRoot = path.join(rootDir, ".opencode", "skills");
const sharedRoot = path.join(rootDir, ".shared", "skills");
const agentsDir = path.join(rootDir, ".agents");
const claudeDir = path.join(rootDir, ".claude");

const allowPath = path.join(rootDir, "skills", "manifest", "shared-skills.allowlist.json");

function loadAllowlist() {
  const json = JSON.parse(fs.readFileSync(allowPath, "utf8"));
  const list = Array.isArray(json.shared_skills) ? json.shared_skills : [];
  return new Set(list);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function symlinkDir(targetRelative, linkPath) {
  if (fs.existsSync(linkPath)) {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  fs.symlinkSync(targetRelative, linkPath, "dir");
}

function listSkillDirs() {
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => ent.name)
    .sort();
}

function syncSharedSkillLinks() {
  const allowlist = loadAllowlist();
  ensureDir(sharedRoot);

  const existingLinks = fs
    .readdirSync(sharedRoot, { withFileTypes: true })
    .filter((ent) => ent.isSymbolicLink() || ent.isDirectory())
    .map((ent) => ent.name);

  for (const name of existingLinks) {
    if (!allowlist.has(name)) {
      fs.rmSync(path.join(sharedRoot, name), { recursive: true, force: true });
    }
  }

  for (const name of allowlist) {
    const src = path.join(skillsRoot, name);
    if (!fs.existsSync(src)) {
      throw new Error(`allowlist skill not found: ${name}`);
    }

    const dst = path.join(sharedRoot, name);
    fs.rmSync(dst, { recursive: true, force: true });
    fs.symlinkSync(path.relative(path.dirname(dst), src), dst, "dir");
  }
}

function linkToolSkillDirs() {
  ensureDir(agentsDir);
  ensureDir(claudeDir);
  symlinkDir("../.shared/skills", path.join(agentsDir, "skills"));
  symlinkDir("../.shared/skills", path.join(claudeDir, "skills"));
}

function main() {
  ensureDir(path.dirname(sharedRoot));
  syncSharedSkillLinks();
  linkToolSkillDirs();
  console.log("Synced shared skills symlinks:");
  console.log("- .shared/skills/*");
  console.log("- .agents/skills -> ../.shared/skills");
  console.log("- .claude/skills -> ../.shared/skills");
}

main();
