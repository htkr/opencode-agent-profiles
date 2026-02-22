import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const rootAgents = path.join(rootDir, "AGENTS.md");
const minimalAgents = path.join(rootDir, ".opencode", "profiles", "minimal", "AGENTS.md");
const claudeMd = path.join(rootDir, "CLAUDE.md");

function main() {
  const errors = [];
  const rootContent = fs.readFileSync(rootAgents, "utf8");
  const minimalContent = fs.readFileSync(minimalAgents, "utf8");

  if (rootContent !== minimalContent) {
    errors.push("AGENTS mismatch: AGENTS.md and .opencode/profiles/minimal/AGENTS.md differ");
  }

  if (!fs.existsSync(claudeMd)) {
    errors.push("missing CLAUDE.md");
  } else {
    const claudeContent = fs.readFileSync(claudeMd, "utf8");
    if (!claudeContent.includes("AGENTS.md")) {
      errors.push("CLAUDE.md must reference AGENTS.md");
    }
  }

  if (errors.length) {
    console.error("agent rules validation errors:");
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }

  console.log("agent rules validation: OK");
}

main();
