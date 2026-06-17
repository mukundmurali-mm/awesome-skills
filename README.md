# awesome-skills

A collection of [Claude Code](https://claude.com/claude-code) skills, shared for others to use.

Each skill lives in its own directory containing a `SKILL.md` file with frontmatter
(`name` + `description`) and usage guidance.

## Skills

| Skill | Description |
| --- | --- |
| [notebooklm-cli](./notebooklm-cli) | Operate the NotebookLM CLI (`nlm`) — manage notebooks, sources, research, and generate artifacts (audio, reports, quizzes, mind maps, slides, videos, and more). |

## Installing a skill

Copy the skill's directory into your Claude Code skills folder:

```bash
# Personal (global) skills
cp -r notebooklm-cli ~/.claude/skills/

# Or, project-scoped skills
cp -r notebooklm-cli /path/to/project/.claude/skills/
```

Claude Code picks up the skill automatically and activates it based on its `description`.

## Contributing

Add a new directory named after your skill with a `SKILL.md` inside, then add a row to the
table above.
