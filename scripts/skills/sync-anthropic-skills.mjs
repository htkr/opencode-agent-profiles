import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const lockPath = path.join(rootDir, "skills", "manifest", "anthropic-skills.lock.json");

function sha256Of(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function parseSkillName(markdown) {
  const m = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const nameLine = m[1]
    .split("\n")
    .find((line) => line.trimStart().startsWith("name:"));
  if (!nameLine) return null;
  return nameLine.split(":")[1]?.trim() || null;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const write = args.has("--write");
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  const errors = [];
  let changed = 0;

  for (const skill of lock.skills) {
    const absPath = path.join(rootDir, skill.path);
    if (!fs.existsSync(absPath)) {
      errors.push(`missing: ${skill.path}`);
      continue;
    }

    const content = fs.readFileSync(absPath, "utf8");
    const frontmatterName = parseSkillName(content);
    if (frontmatterName !== skill.name) {
      errors.push(`name mismatch: ${skill.path} (manifest=${skill.name}, file=${frontmatterName || "<none>"})`);
    }

    const hash = sha256Of(content);
    if (skill.sha256 !== hash) {
      changed += 1;
      skill.sha256 = hash;
    }
  }

  lock.updated_at = new Date().toISOString();

  if (write) {
    fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  }

  console.log(`skills in manifest: ${lock.skills.length}`);
  console.log(`hash updates: ${changed}`);
  console.log(`write lock: ${write ? "yes" : "no"}`);

  if (errors.length > 0) {
    console.error("validation errors:");
    for (const err of errors) console.error(`- ${err}`);
    process.exit(1);
  }
}

main();
