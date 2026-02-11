const SECRET_PATTERNS = [
  /\.env/i,
  /token/i,
  /credential/i,
  /secret/i,
  /key/i
];

function hasSecretPattern(value) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export const ExperimentGuardPlugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read") {
        const filePath = String(output.args?.filePath || "");
        if (hasSecretPattern(filePath)) {
          throw new Error("Do not read secret-related files.");
        }
      }

      if (input.tool === "write" || input.tool === "edit" || input.tool === "patch") {
        const filePath = String(output.args?.filePath || output.args?.path || "");
        if (hasSecretPattern(filePath)) {
          throw new Error("Do not write secret-related files.");
        }
      }
    }
  };
};
