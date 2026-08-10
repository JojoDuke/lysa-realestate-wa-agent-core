import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative } from "node:path";

const JOURNAL_PATH = "docs/journal.md";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function time() {
  return new Date().toTimeString().slice(0, 5);
}

function ensureJournalExists() {
  const dir = dirname(JOURNAL_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(JOURNAL_PATH)) {
    writeFileSync(
      JOURNAL_PATH,
      [
        "# Project Journal",
        "",
        "_Auto-generated from Cursor activity. Commits and pushes are logged from the terminal; agent edits are logged as they happen. Manual edits appear when you commit._",
        "",
      ].join("\n"),
    );
  }
}

function ensureDaySection(date) {
  ensureJournalExists();
  const heading = `## ${date}`;
  const content = readFileSync(JOURNAL_PATH, "utf8");
  if (content.includes(heading)) {
    return;
  }
  appendFileSync(JOURNAL_PATH, `\n${heading}\n\n`);
}

function appendEntry(kind, lines) {
  ensureDaySection(today());
  const body = lines.map((line) => `- ${line}`).join("\n");
  appendFileSync(JOURNAL_PATH, `\n### ${time()} — ${kind}\n${body}\n`);
}

function relPath(absPath, workspaceRoots) {
  if (!absPath) {
    return "unknown file";
  }
  const root = workspaceRoots?.[0] ?? process.cwd();
  try {
    return relative(root, absPath).replaceAll("\\", "/");
  } catch {
    return absPath.replaceAll("\\", "/");
  }
}

function parseGitCommit(output, command) {
  const hashMatch = output.match(/\[[\w./-]+\s+([0-9a-f]{7,40})\]/i);
  const messageMatch = output.match(/\[[\w./-]+\s+[0-9a-f]+\]\s*(.+)/i);
  const message =
    messageMatch?.[1]?.trim() ??
    command.replace(/^git\s+commit\b/i, "").trim() ??
    "Commit completed";

  return {
    hash: hashMatch?.[1]?.slice(0, 7),
    message,
  };
}

function parseGitPush(output, command) {
  const rangeMatch = output.match(
    /([0-9a-f]{7,40})\.\.([0-9a-f]{7,40})\s+([\w./-]+)\s+->\s+([\w./-]+)/i,
  );
  const branchMatch = command.match(
    /git\s+push(?:\s+-u)?(?:\s+\S+)?(?:\s+([\w./-]+))?/i,
  );

  if (rangeMatch) {
    const [, from, to, localRef, remoteRef] = rangeMatch;
    return `Pushed \`${localRef}\` → \`${remoteRef}\` (${from.slice(0, 7)}..${to.slice(0, 7)})`;
  }

  const branch = branchMatch?.[1] ?? "branch";
  const summary = output.trim().split("\n").at(-1)?.trim();
  return summary
    ? `Pushed \`${branch}\` — ${summary}`
    : `Pushed \`${branch}\``;
}

function handleSessionStart() {
  ensureDaySection(today());
}

function handleFileEdit(input) {
  const path = relPath(input.file_path, input.workspace_roots);
  const edits = input.edits ?? [];
  const isNew =
    edits.length > 0 && edits.every((edit) => !edit.old_string?.trim());
  const action = isNew ? "Created" : "Modified";
  appendEntry("Edit", [`${action} \`${path}\``]);
}

function handleShellExecution(input) {
  const command = (input.command ?? "").trim();
  const output = input.output ?? "";

  if (/^git\s+commit\b/i.test(command)) {
    const { hash, message } = parseGitCommit(output, command);
    appendEntry(
      "Commit",
      hash ? [`\`${hash}\` ${message}`] : [message],
    );
    return;
  }

  if (/^git\s+push\b/i.test(command)) {
    appendEntry("Push", [parseGitPush(output, command)]);
  }
}

async function main() {
  const input = await readStdin();
  const event = input.hook_event_name ?? "unknown";

  switch (event) {
    case "sessionStart":
    case "workspaceOpen":
      handleSessionStart();
      break;
    case "afterFileEdit":
      handleFileEdit(input);
      break;
    case "afterShellExecution":
      handleShellExecution(input);
      break;
    default:
      break;
  }
}

main().catch(() => {
  // Journal hooks should never block Cursor workflow.
  process.exit(0);
});
