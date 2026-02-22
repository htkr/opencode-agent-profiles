import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const manifestPath = path.join(rootDir, "skills", "manifest", "anthropic-skills.lock.json");
const allowPath = path.join(rootDir, "skills", "manifest", "shared-skills.allowlist.json");
const nonsharedPath = path.join(rootDir, "skills", "manifest", "nonshared-skills.json");
const sharedRoot = path.join(rootDir, ".shared", "skills");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fail(msg, errors) {
  errors.push(msg);
}

function main() {
  const manifest = loadJson(manifestPath);
  const allow = loadJson(allowPath);
  const nonshared = loadJson(nonsharedPath);
  const errors = [];

  const manifestNames = new Set((manifest.skills || []).map((s) => s.name));
  const allowNames = new Set(allow.shared_skills || []);
  const nonsharedNames = new Set((nonshared.nonshared_skills || []).map((s) => s.name));

  for (const name of allowNames) {
    if (!manifestNames.has(name)) fail(`allowlist not in manifest: ${name}`, errors);
    if (nonsharedNames.has(name)) fail(`skill in both allowlist and nonshared: ${name}`, errors);
  }

  for (const name of nonsharedNames) {
    if (!manifestNames.has(name)) fail(`nonshared not in manifest: ${name}`, errors);
  }

  for (const name of manifestNames) {
    const inAllow = allowNames.has(name);
    const inNonshared = nonsharedNames.has(name);
    if (!inAllow && !inNonshared) fail(`unclassified skill: ${name}`, errors);
  }

  if (fs.existsSync(sharedRoot)) {
    const linked = new Set(
      fs
        .readdirSync(sharedRoot, { withFileTypes: true })
        .filter((ent) => ent.isSymbolicLink() || ent.isDirectory())
        .map((ent) => ent.name)
    );

    for (const name of allowNames) {
      if (!linked.has(name)) fail(`missing shared link: .shared/skills/${name}`, errors);
    }

    for (const name of linked) {
      if (!allowNames.has(name)) fail(`unexpected shared link: .shared/skills/${name}`, errors);
    }
  } else {
    fail("missing .shared/skills directory (run sync-shared-skills.mjs)", errors);
  }

  if (errors.length) {
    console.error("shared skills validation errors:");
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }

  console.log("shared skills validation: OK");
  console.log(`- manifest skills: ${manifestNames.size}`);
  console.log(`- shared skills: ${allowNames.size}`);
  console.log(`- nonshared skills: ${nonsharedNames.size}`);
}

main();
