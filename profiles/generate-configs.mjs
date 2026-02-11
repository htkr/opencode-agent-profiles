import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsPath = path.join(__dirname, "subagent-models.json");
const profilesDir = __dirname;

const models = JSON.parse(fs.readFileSync(modelsPath, "utf8"));

const keybinds = {
  input_submit: "shift+return",
  input_newline: "return,ctrl+return,alt+return,ctrl+j"
};

const provider = {
  google: {
    name: "Google"
  }
};

const commonMainModel = models.main.default;

const experimentAgents = {
  "exp-orchestrator": {
    mode: "subagent",
    description: "Experiment workflow orchestration",
    model: models.subagents.exp_orchestrator
  },
  "exp-runner": {
    mode: "subagent",
    description: "Experiment implementation and execution",
    model: models.subagents.exp_runner
  },
  "exp-reporter": {
    mode: "subagent",
    description: "Experiment report generation",
    model: models.subagents.exp_reporter
  },
  "exp-indexer": {
    mode: "subagent",
    description: "Experiment master index updates",
    model: models.subagents.exp_indexer
  }
};

const ohmyConfig = {
  $schema: "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  google_auth: false,
  agents: {
    oracle: { model: models.subagents.oracle },
    librarian: { model: models.subagents.librarian },
    explore: { model: models.subagents.explore },
    prometheus: { model: models.subagents.prometheus },
    metis: { model: models.subagents.metis },
    momus: { model: models.subagents.momus },
    atlas: { model: models.subagents.atlas }
  },
  sisyphus_agent: {
    disabled: false,
    default_builder_enabled: false,
    planner_enabled: true,
    replace_plan: true
  },
  categories: {
    quick: { model: models.categories.quick },
    writing: { model: models.categories.writing },
    "unspecified-low": { model: models.categories["unspecified-low"] },
    "unspecified-high": { model: models.categories["unspecified-high"] },
    ultrabrain: { model: models.categories.ultrabrain, variant: "xhigh" },
    deep: { model: models.categories.deep, variant: "medium" }
  }
};

const opencodeOhmy = {
  $schema: "https://opencode.ai/config.json",
  model: commonMainModel,
  keybinds,
  provider,
  plugin: ["opencode-antigravity-auth@latest", "oh-my-opencode@latest"],
  agent: {
    ...experimentAgents
  }
};

const opencodeVanilla = {
  $schema: "https://opencode.ai/config.json",
  model: commonMainModel,
  keybinds,
  provider,
  plugin: ["opencode-antigravity-auth@latest"],
  agent: {
    build: {
      mode: "primary"
    },
    plan: {
      mode: "primary"
    },
    "explore-light": {
      mode: "subagent",
      description: "Fast codebase exploration",
      model: models.subagents.explore
    },
    "summarize-light": {
      mode: "subagent",
      description: "Quick summaries and triage",
      model: models.subagents.librarian
    },
    "analyze-medium": {
      mode: "subagent",
      description: "Medium-complexity analysis",
      model: models.subagents.oracle
    },
    ...experimentAgents
  }
};

function writeJson(targetPath, data) {
  fs.writeFileSync(targetPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

writeJson(path.join(profilesDir, "ohmy", "opencode.json"), opencodeOhmy);
writeJson(path.join(profilesDir, "ohmy", "oh-my-opencode.json"), ohmyConfig);
writeJson(path.join(profilesDir, "vanilla", "opencode.json"), opencodeVanilla);

console.log("Generated profile configs:");
console.log("- profiles/ohmy/opencode.json");
console.log("- profiles/ohmy/oh-my-opencode.json");
console.log("- profiles/vanilla/opencode.json");
