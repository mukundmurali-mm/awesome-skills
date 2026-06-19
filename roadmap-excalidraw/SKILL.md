---
name: roadmap-excalidraw
description: Build roadmap.sh-style learning roadmaps as editable Excalidraw scenes. Use when the user wants to create, visualize, or design a roadmap, learning path, skill tree, or curriculum (e.g. "make a roadmap for X", "build a frontend roadmap", "visualize a learning path in Excalidraw"). Produces a .excalidraw file with a central dashed spine, yellow topic boxes, and purple subtopics.
---

# Roadmap → Excalidraw

Generate roadmaps that mimic the **roadmap.sh** visual language, rendered as **Excalidraw**
scenes the user can open and edit. roadmap.sh itself uses a React Flow node graph; this skill
recreates its *style + layout* (central dashed spine, yellow topics alternating left/right of the
spine, purple subtopics stacked under each topic, hand-drawn Rough.js look) and emits an
`.excalidraw` file via a zero-dependency Node generator.

## Workflow

1. **Get the content.**
   - If the user gives **only a subject** (e.g. "Rust backend roadmap"), design a sensible
     topic → subtopic breakdown yourself.
   - If the user gives a **markdown/outline or list**, normalize it to the schema below.
2. **Write the outline JSON** to a file (e.g. `roadmap.json`).
3. **Run the generator:**
   ```bash
   node <skill-dir>/generate.js roadmap.json -o roadmap.excalidraw
   ```
   (`<skill-dir>` = `~/.claude/skills/roadmap-excalidraw`. Output defaults next to the input if
   `-o` is omitted.)
4. **Tell the user how to open it:** drag-and-drop the `.excalidraw` file onto
   [excalidraw.com](https://excalidraw.com), or open it with the Excalidraw VS Code extension or
   desktop app.

## Outline schema

```json
{
  "title": "Frontend",
  "topics": [
    {
      "name": "Internet",
      "subtopics": [
        { "name": "How does the internet work?", "level": "recommended" },
        "What is HTTP?",
        { "name": "Browsers and how they work", "level": "optional" }
      ]
    },
    { "name": "HTML", "subtopics": ["Learn the basics", "Semantic HTML"] }
  ]
}
```

- `subtopics` entries may be plain **strings** (shorthand, treated as `recommended`) or
  **objects** with an optional `level`.
- `level`: `recommended` → solid purple box; `optional` → outlined purple box (mirrors
  roadmap.sh's "alternative/optional" emphasis).
- Keep topic/subtopic names short (a few words) so they fit the boxes.

See `examples/frontend.json` for a complete worked example.

## Style guide (what the generator reproduces)

- **Central dashed spine** down the middle (blue `#0a33ff`), the backbone of the roadmap.
- **Title**: large hand-drawn text centered above the spine.
- **Topics**: yellow (`#ffe599`) rounded rectangles with black border, **alternating** to the
  right and left of the spine, connected to it with short lines. The vertical order = learning
  order, top to bottom.
- **Subtopics**: purple boxes (`#d9ccf5` solid, or outlined when `optional`) stacked in a column
  under their topic, chained with thin connectors.
- Hand-drawn font + Rough.js sketch style (Excalidraw native) match the roadmap.sh feel.

To tweak colors, spacing, or fonts, edit the `STYLE` / `LAYOUT` constants at the top of
`generate.js`.

## Notes

- The script is **Node, zero dependencies** — output is plain Excalidraw JSON. Turning a subject
  or freeform outline into the outline schema is the model's job; the script only does layout.
- Text labels are **bound** to their boxes (they move/resize together when edited).
- Connectors are plain lines (not interactive bindings), which keeps layout robust; the user can
  re-route or re-bind them in Excalidraw if desired.
