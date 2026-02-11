export const ExperimentNotifyPlugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle" && event.type !== "session.error") return;

      const title = event.type === "session.idle" ? "OpenCode: 実験完了" : "OpenCode: 実験エラー";
      const body = event.type === "session.idle" ? "セッション処理が完了しました" : "セッションでエラーが発生しました";

      try {
        await $`notify-send ${title} ${body}`;
      } catch {
        // Linux notify-send がない環境では無視
      }
    }
  };
};
