# Workflow: graphify knowledge graph

## Objective

Keep a queryable map of the `Basic GEE Training` repository (files, functions, and what calls or loads what) so that questions about the code are answered from the graph first, and source files are opened only for the lines the graph points to.

## When to use

- Before answering "where is X", "what calls X", "what breaks if I change X" or "how does A reach B".
- After adding, renaming, deleting or editing code: rebuild the graph.
- At the start of work on an unfamiliar part of the repository.

## Required inputs

- The graphify CLI (PyPI package `graphifyy`, command `graphify`). Install once per machine: `uv tool install graphifyy`.
- No API key. The build parses code locally; nothing leaves the machine.

## Tools

| Tool | What it does |
| --- | --- |
| `graphify update .` | Builds or rebuilds `graphify-out/` for this repository. |
| `graphify query / explain / path / affected / god-nodes` | Read the graph. |
| `/graphify` skill (`.claude/skills/graphify/`) | The full graphify pipeline inside Claude Code, including the optional pass over documents. |

## Steps

1. **Build or rebuild the graph** from the repository root:

   ```bash
   graphify update .
   ```

   Add `--force` after deleting code (graphify refuses to replace a graph with a smaller one otherwise).

2. **Query it** from the repository root:

   ```bash
   graphify query "<a question about the code>"
   graphify explain "<a function name>"
   graphify affected "<a function name>"      # what depends on it
   graphify god-nodes --top 10        # most connected functions
   ```

3. **Open source files only for the lines the graph names.** The graph gives `file:line` for every node and edge.

4. **Broad review:** read `graphify-out/GRAPH_REPORT.md`, or open `graphify-out/graph.html` in a browser.

## Expected outputs

`graphify-out/graph.json`, `GRAPH_REPORT.md` and `graph.html`. The folder is in `.gitignore`: it is rebuilt with one command and is not pushed.

## Rules and edge cases

- **Files with no functions give no nodes.** Scripts that are only top-level calls, and data files, are reported as "yielded no symbols". This is expected, and it means a repository of standalone scripts gives a small graph.
- **Use exact node names for `path` and `explain`.** Functions are named with brackets, for example `myFunction()`. A name defined in more than one file is refused with the candidates listed (exit code 3): retry as `<path>::<name>`. No match gives exit code 4.
- **Paths are directed.** If `graphify path A B` finds nothing, try `--undirected`.
- **Documents are only partly covered by the local build.** For a full pass over documents run `/graphify . --update` in Claude Code; that pass uses the assistant's model.
- **Hooks.** `.claude/settings.json` registers graphify hooks that remind the agent to query the graph before searching or reading files. They are reminders only. To remove graphify from this repository: `graphify claude uninstall --project`.
- **Upgrading:** `uv tool upgrade graphifyy`, then `graphify claude install --project` to refresh the skill.
