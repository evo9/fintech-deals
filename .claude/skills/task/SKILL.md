---
name: task
description: Implement exactly one subtask from .agent/TASKS.md by its id (e.g. /task 4.3), verify it and stop with a report and a proposed commit message.
argument-hint: <task id, e.g. 4.3>
disable-model-invocation: true
---

Task id: $ARGUMENTS

1. Read the task `$ARGUMENTS` in `.agent/TASKS.md` and every spec section it references in `.agent/SPEC.md`. Read `.agent/PROGRESS.md`.
2. Preconditions:
   - If the task depends on tasks not marked done in PROGRESS.md, stop and say which.
   - If the task is SHOULD/COULD and PROGRESS.md shows the current checkpoint was missed, stop and ask whether to do it (spec section 10, cut order).
   - If something needed for the task is not described in SPEC.md or ASSIGNMENT.md, ask instead of inventing it.
3. Write a plan of 3-7 bullets (files to create/change), then implement. Stay inside this task: do not start the next one, do not refactor unrelated code.
4. Follow `.claude/rules/*` and, where relevant, the `server-action` and `paginated-list` skills.
5. Run `npm run typecheck`, `npm run lint`, `npm run build` (and `npm run test` if tests exist). Fix every error.
6. If the task touched Server Actions, queries or guards, run the `access-reviewer` subagent on the changed files and fix CRITICAL findings.
7. Update `.agent/PROGRESS.md`: tick the task, add decisions made and why (one line each), new dependencies with reason, deviations from the spec.
8. Report in Russian, short:

```
Задача <id> - готово | частично (почему)
Сделано: ...
Файлы: ...
Решения по ходу: ...
Проверить руками: <конкретные шаги: аккаунт, URL, что нажать, что ожидать>
Коммит: <type(scope): message>
```

Never run `git commit` / `git push`. Then stop and wait.
