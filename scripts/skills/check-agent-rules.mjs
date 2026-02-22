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

  const requiredPhrases = [
    "フォールバック禁止（最重要）",
    "代替確認手順は、実装の代替や迂回ではなく、検証不能理由の説明・再現手順・手動確認手順の提示に限定する。",
    "後方互換性をデフォルトで考慮しない。",
    "## Confirmation Gate",
    "## Design Principles",
    "常にシンプルな実装を優先し、DRY, KISS, YAGNIの原則を守る。",
  ];

  if (rootContent !== minimalContent) {
    errors.push("AGENTS mismatch: AGENTS.md and .opencode/profiles/minimal/AGENTS.md differ");
  }

  for (const phrase of requiredPhrases) {
    if (!rootContent.includes(phrase)) {
      errors.push(`AGENTS.md missing required phrase: ${phrase}`);
    }
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
