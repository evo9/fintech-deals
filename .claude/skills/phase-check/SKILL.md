---
name: phase-check
description: Close a phase - run verification and reviews in parallel, consolidate findings, update PROGRESS.md, output the phase report with a commit message. Usage /phase-check 4
argument-hint: <phase number>
disable-model-invocation: true
---

Phase: $ARGUMENTS

1. Launch in parallel (one message, several Agent calls):
   - `phase-verifier` with "phase $ARGUMENTS";
   - `access-reviewer` on the files changed in this phase, if the phase has server code (phases 3-7);
   - `ui-reviewer` on the files changed in this phase, if the phase has UI (phases 1, 3-8).
   Changed files: `git status --short` and `git diff --name-only` (the developer commits per task, so also use PROGRESS.md for the list of tasks in the phase).
2. Consolidate: one list, CRITICAL first, duplicates merged. Do not fix anything yet.
3. Update `.agent/PROGRESS.md`: phase status, time spent if the developer gave it, open issues.
4. Report in Russian:

```
Фаза <N> - готова | не готова
Критерии: x из y (непройденные списком)
Critical: ... (file:line - что - как исправить)
Warning: ...
Проверить руками: ...
Контрольная точка: <если фаза 4, 6 или 7 - что говорит спека про вычёркивание>
Коммит фазы (если задачи коммитились по одной - не нужен): <type(scope): message>
```

5. Ask which findings to fix. Do not start the next phase.
