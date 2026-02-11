import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tiersPath = path.join(__dirname, "model-tiers.json");
const registryPath = path.join(__dirname, "subagent-registry.json");
const profilesDir = __dirname;

const tiersConfig = JSON.parse(fs.readFileSync(tiersPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const keybinds = {
  input_submit: "shift+return",
  input_newline: "return,ctrl+return,alt+return,ctrl+j"
};

const provider = {
  google: {
    name: "Google"
  }
};

const mcp = {
  brave: {
    type: "local",
    command: ["npx", "-y", "@brave/brave-search-mcp-server"],
    environment: {
      BRAVE_API_KEY: "{env:BRAVE_API_KEY}"
    },
    enabled: true
  }
};

const tools = {
  "brave_*": false
};

const permission = {
  skill: {
    "*": "allow"
  },
  task: {
    "*": "allow"
  },
  bash: {
    "*": "ask",
    "agent-browser *": "allow"
  }
};

const tiers = tiersConfig.tiers || {};

function resolveTier(tierName) {
  const model = tiers[tierName];
  if (!model) {
    throw new Error(`Unknown tier: ${tierName}`);
  }
  return model;
}

function buildOpencodeAgents(profileName) {
  const out = {};
  const defs = registry.opencode_agents || {};

  for (const [name, def] of Object.entries(defs)) {
    const profiles = Array.isArray(def.profiles) ? def.profiles : ["vanilla", "ohmy"];
    if (!profiles.includes(profileName)) continue;
    if (!def.description) {
      throw new Error(`Missing description for opencode agent: ${name}`);
    }
    if (!def.tier) {
      throw new Error(`Missing tier for opencode agent: ${name}`);
    }

    out[name] = {
      mode: def.mode || "subagent",
      description: def.description,
      model: resolveTier(def.tier)
    };
  }

  return out;
}

function buildOhmyAgents() {
  const out = {};
  const defs = registry.ohmy_agents || {};

  for (const [name, def] of Object.entries(defs)) {
    if (!def.tier) {
      throw new Error(`Missing tier for oh-my-opencode agent: ${name}`);
    }
    out[name] = {
      model: resolveTier(def.tier)
    };
  }

  return out;
}

function buildOhmyCategories() {
  const out = {};
  const defs = registry.ohmy_categories || {};

  for (const [name, def] of Object.entries(defs)) {
    if (!def.tier) {
      throw new Error(`Missing tier for oh-my-opencode category: ${name}`);
    }
    out[name] = {
      model: resolveTier(def.tier)
    };

    if (def.variant) {
      out[name].variant = def.variant;
    }
  }

  return out;
}

const commonMainModel = resolveTier(tiersConfig.main.default_tier);

const vanillaAgents = buildOpencodeAgents("vanilla");
const ohmyAgents = buildOpencodeAgents("ohmy");

const ohmyConfig = {
  $schema: "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  google_auth: false,
  agents: buildOhmyAgents(),
  sisyphus_agent: {
    disabled: false,
    default_builder_enabled: false,
    planner_enabled: true,
    replace_plan: true
  },
  categories: buildOhmyCategories()
};

const opencodeOhmy = {
  $schema: "https://opencode.ai/config.json",
  model: commonMainModel,
  keybinds,
  provider,
  mcp,
  tools,
  permission,
  plugin: ["opencode-antigravity-auth@latest", "oh-my-opencode@latest", "./.opencode/plugins/ask-user-question.js"],
  agent: {
    ...ohmyAgents
  }
};

const opencodeVanilla = {
  $schema: "https://opencode.ai/config.json",
  model: commonMainModel,
  keybinds,
  provider,
  mcp,
  tools,
  permission,
  plugin: ["opencode-antigravity-auth@latest", "./.opencode/plugins/ask-user-question.js"],
  agent: {
    build: {
      mode: "primary"
    },
    plan: {
      mode: "primary"
    },
    ...vanillaAgents
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
