---
name: notebooklm-cli
description: Help users operate the NotebookLM CLI (`nlm`) to manage notebooks, add/sync sources, run research, query sources, and generate artifacts (audio overviews, reports, quizzes, flashcards, mind maps, slides, infographics, videos, data tables). Use when the user mentions NotebookLM, `nlm`, notebooks/sources/podcasts from the command line, or asks to create/query/research notebooks programmatically.
---

# NotebookLM CLI (`nlm`)

Drive Google NotebookLM from the terminal via the `nlm` binary
(https://github.com/jacob-bd/notebooklm-cli).

## Default workflow

1. If the command is known, run it directly (e.g. `nlm notebook list`).
2. **Resolve IDs first.** Most commands need a notebook ID. Run `nlm notebook list` (or
   `nlm notebook list --json` to parse) to get IDs, or use an alias (see Aliases).
3. **When unsure of flags, check the live interface** — run `nlm --ai` (emits AI-friendly docs) or
   `nlm <command> --help`. The version installed may differ from this cheat-sheet; trust `--help`.
4. **Generation and destructive commands need `--confirm` / `-y`.** Never add `--confirm` to a
   delete, sync, or generation command unless the user clearly asked for that action.

## Prerequisites

- Requires the `nlm` binary, Python 3.10+, and Google Chrome (auth uses Chrome DevTools Protocol).
- Install: `pipx install notebooklm-cli` (recommended) — or `pip install notebooklm-cli`
  / `uv tool install notebooklm-cli`.
- If `nlm` is missing, suggest the install command; do not install without the user's ok.

## Authentication

```bash
nlm login                              # Authenticate via Chrome
nlm login --profile <name>             # Log in to a specific account
nlm login --check                      # Check credentials
nlm auth status                        # Verify the current session is valid
nlm auth list                          # List stored profiles
nlm auth delete <profile> --confirm    # Remove a profile
```

Most commands accept `--profile <name>` to target a specific account.

## Notebooks

```bash
nlm notebook list                      # List all notebooks (use --json to parse)
nlm notebook create "Title"            # Create a notebook
nlm notebook get <id>                  # Notebook details
nlm notebook describe <id>             # AI-generated summary
nlm notebook query <id> "question"     # Ask a question against the notebook's sources
nlm notebook delete <id> --confirm     # Delete (destructive)
```

## Sources

```bash
nlm source list <notebook-id>                       # List sources
nlm source list <notebook-id> --drive               # Show Drive sources w/ freshness
nlm source list <notebook-id> --drive -S            # Faster (skip freshness check)
nlm source add <id> --url "URL"                     # Add a URL or YouTube video
nlm source add <id> --text "content" --title "..."  # Add pasted text
nlm source add <id> --drive <doc-id>                # Add a Google Drive document
nlm source describe <source-id>                     # AI summary of a source
nlm source content <source-id>                      # Retrieve raw text
nlm source stale <notebook-id>                      # List outdated Drive sources
nlm source sync <notebook-id> --confirm             # Sync Drive sources (re-ingest)
```

## Research (discovery)

```bash
nlm research start "query" --notebook-id <id>                 # Web search (~30s)
nlm research start "query" --notebook-id <id> --mode deep     # Deep research (~5min)
nlm research start "query" --notebook-id <id> --source drive  # Search Google Drive
nlm research status <notebook-id>                             # Check progress
nlm research import <notebook-id> <task-id>                   # Import results as sources
```

Research is async: `start` returns a task, poll `status`, then `import` when complete.

## Content generation

All of these need `--confirm` (or `-y`) and may take a while:

```bash
nlm audio create <id> --confirm                        # Podcast / audio overview
nlm report create <id> --confirm                       # Briefing document
nlm quiz create <id> --confirm                         # Quiz questions
nlm flashcards create <id> --confirm                   # Flashcards
nlm mindmap create <id> --confirm                      # Mind map
nlm slides create <id> --confirm                       # Slide deck
nlm infographic create <id> --confirm                  # Infographic
nlm video create <id> --confirm                        # Video overview
nlm data-table create <id> "description" --confirm     # Extract a data table
```

## Studio (artifact management)

```bash
nlm studio status <notebook-id>                            # List generated artifacts
nlm studio delete <notebook-id> <artifact-id> --confirm   # Delete an artifact
```

## Chat (interactive REPL)

```bash
nlm chat start <notebook-id>           # Launch an interactive chat session
nlm chat configure <notebook-id>       # Set chat goal/style
```

REPL commands inside a session: `/sources`, `/clear`, `/help`, `/exit`.

## Aliases

UUIDs are unwieldy — alias them to readable names, then use the name anywhere an ID is expected.

```bash
nlm alias set <name> <uuid>            # Create a shortcut
nlm alias list                         # Show all aliases
nlm alias get <name>                   # Resolve an alias to its UUID
nlm alias delete <name>                # Remove an alias
```

## Config & output formats

```bash
nlm config show                        # Display settings
nlm config get <key>                   # Read a setting
nlm config set <key> <value>           # Update a setting

# Output flags (on list-style commands):
nlm notebook list --json               # JSON (use when parsing programmatically)
nlm notebook list --quiet              # IDs only
nlm notebook list --title              # "ID: Title"
nlm notebook list --full               # All columns
```

## Utilities

```bash
nlm --ai                  # Output AI-friendly documentation (run this when unsure)
nlm --install-completion  # Enable shell tab completion
nlm --show-completion     # Print the completion script
```

## Notes

- Prefer `--json` output when you need to extract IDs or fields for follow-up commands.
- Surface the notebook/source/artifact IDs back to the user so they can reference them later.
- Generation jobs are not instant — set expectations (audio/deep research can take minutes).
