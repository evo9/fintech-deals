// PreToolUse guard for Bash. Catches forbidden commands even inside
// compound commands (`cd x && git commit ...`), which prefix rules can miss.
// Exit code 2 blocks the call; stderr is shown to the agent.
import { readFileSync } from 'node:fs';

let command = '';
try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  command = input?.tool_input?.command ?? '';
} catch {
  process.exit(0);
}

const rules = [
  [/\bgit\s+(commit|push)\b/, 'The agent never commits or pushes. Propose a commit message instead.'],
  [/\bprisma\s+db\s+push\b/, 'Use migrations (prisma migrate dev), not db push.'],
  [/\bprisma\s+migrate\s+reset\b/, 'Use `npm run db:reset` and only with the developer\'s approval.'],
  [/--force-reset\b/, 'Destructive database flag is not allowed.'],
  [/\bdb\.[a-z0-9]+\.supabase\.co\b/, 'Do not use the direct db.*.supabase.co host (IPv6-only). Use the pooler URLs from .env.'],
];

for (const [pattern, message] of rules) {
  if (pattern.test(command)) {
    process.stderr.write(`Blocked by .claude/hooks/guard-bash.mjs: ${message}\n`);
    process.exit(2);
  }
}
process.exit(0);
