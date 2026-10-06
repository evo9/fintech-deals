---
name: status
description: Show progress against the 24-hour plan - done tasks, current phase, elapsed time vs spec checkpoints, and what to cut if behind. Usage /status
disable-model-invocation: true
---

1. Read `.agent/PROGRESS.md` (start time is in its header) and `.agent/TASKS.md`. Get the current time with `date`.
2. Compute elapsed hours since start. Compare with the cumulative budgets in spec section 10 and the checkpoints: 7 h (catalog on prod), 11 h (all buyer and seller flows), 12.5 h (feature freeze).
3. If behind, name what to cut, strictly in the spec order: COULD -> moderation log -> tests -> Best match sort and "Match against" -> Validated -> live preview. MUST is never cut.
4. Output in Russian, max 12 lines:

```
Старт: <time>, прошло: <h> ч, до сдачи (15.5 ч): <h> ч, до дедлайна (24 ч): <h> ч
Фаза: <N> - <название>, задач готово x/y
Отставание: <+/- ч> от плана
Ближайшая контрольная точка: <что должно работать к какому часу>
Рекомендация: <продолжать | вычеркнуть ...>
Следующая задача: /task <id> - <название>
```

If the start time is empty, ask for it and stop.
