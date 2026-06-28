Demo: Paged ContentEditable Editor

This demo adds a minimal client-side paged editor to the repository under demo/.

Files added:
- demo/editor.html  — simple HTML page to open in the browser
- demo/editor.css   — page styles (A4-ish)
- demo/editor.js    — JS that detects overflow and moves content to new pages

How to try locally:
1. Clone the repo and open demo/editor.html in a browser (double-click or use a small static server).

   Example using Python's http.server from the repo root:

   ```bash
   python3 -m http.server 8000
   # then open http://localhost:8000/demo/editor.html
   ```

2. Start typing or paste a lot of text — when the page fills the script will create a new page and move overflow content.

Notes:
- This is a demo to demonstrate the overflow/flow behavior. Your real project may use a framework and different DOM structure; you can adapt the core logic in demo/editor.js (flowCheckFrom, moveOverflow, splitBlockBetweenPages) into your editor component.
- If you want, I can integrate this logic into an existing file in the repo — paste that file here or tell me which path to modify.
