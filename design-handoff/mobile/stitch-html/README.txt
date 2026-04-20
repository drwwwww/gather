Gather — Stitch HTML exports (mobile)

Reverted: the old `stitch-export/` fetch script (SDK + curl) has been removed from this repo.

What is here now
- `screen-01-design-system.html` — first Stitch export (labeled “Design System” in Stitch; visually the sign-in canvas).
- `screen-10-serve.html` — Serve tab export.
- `split-bundle.mjs` — optional splitter if you save the full multi-screen paste below.

To generate every `screen-NN-*.html` from one paste (optional)
1. Save your full Stitch export (every `<!-- … -->` line plus the following `<!DOCTYPE html>…</html>` block) as `_paste-bundle.txt` in this folder. Each marker must be on its own line, immediately before its document.
2. From this directory run:
     node split-bundle.mjs
3. The script writes one file per marker (e.g. `screen-02-sign-in.html`, …, `screen-10-serve.html`). Re-running overwrites those outputs.

If `node` is not on PATH, use the same command from the repo root with an explicit path to Node.
