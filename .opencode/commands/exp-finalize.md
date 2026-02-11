---
description: 実験レポート作成とマスター更新を行い commit/push する
agent: exp-orchestrator
subtask: true
---

1. Run `bash scripts/exp/finalize-exp.sh $ARGUMENTS`.
2. Ask `@exp-reporter` to improve `exp/$1/report.md` using the run log and results.
3. Ask `@exp-indexer` to update `exp/MASTER.csv` and `exp/MASTER.md` if needed.
4. Commit and push only experiment-related files for `$1`.
5. Report commit hash and push result.
