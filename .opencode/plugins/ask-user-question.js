import { tool } from "@opencode-ai/plugin";

function validateOptions(options) {
  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    throw new Error("options must contain between 2 and 6 items");
  }

  for (const item of options) {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new Error("each option must be a non-empty string");
    }
  }
}

function formatQuestion({ question, options, recommended, context }) {
  const normalized = options.map((item) => item.trim());
  const lines = [];

  lines.push(`質問: ${question.trim()}`);
  if (context && context.trim()) {
    lines.push(`前提: ${context.trim()}`);
  }
  lines.push("選択肢:");

  normalized.forEach((option, idx) => {
    const marker = recommended && option === recommended.trim() ? " (Recommended)" : "";
    lines.push(`${idx + 1}. ${option}${marker}`);
  });

  lines.push("回答方法: 番号で回答してください。必要なら理由を1行添えてください。");
  return lines.join("\n");
}

export const AskUserQuestionPlugin = async () => {
  return {
    tool: {
      ask_user_question: tool({
        description: "Ask user with concise multiple-choice options",
        args: {
          question: tool.schema.string().min(1).describe("Question text"),
          options: tool.schema.array(tool.schema.string()).describe("2 to 6 options"),
          recommended: tool.schema.string().optional().describe("Recommended option label"),
          context: tool.schema.string().optional().describe("Optional short context")
        },
        async execute(args) {
          validateOptions(args.options);

          if (args.recommended) {
            const recommended = args.recommended.trim();
            const found = args.options.some((item) => item.trim() === recommended);
            if (!found) {
              throw new Error("recommended must match one of options exactly");
            }
          }

          return formatQuestion(args);
        }
      })
    }
  };
};
