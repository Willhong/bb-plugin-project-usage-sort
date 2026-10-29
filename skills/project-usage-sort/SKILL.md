---
name: project-usage-sort
description: Preview or apply the Project Usage Sort plugin's ordering of bb projects by how often each is used, with the `bb project-usage-sort` CLI. Use when the user asks why projects are in their current order, wants the project list re-sorted now, or wants to change how usage is weighed.
---

# Project Usage Sort

The plugin orders bb projects by usage. Every thread in a project adds a
weight that halves every `halfLifeDays` since the thread was last updated, so a
project used often and recently comes first. Active and archived threads count;
hidden threads do not. The personal project is not reorderable and is left out.

It writes the order to two places:

- the server's project order, which project pickers and plugin sidebars such as
  BB Sidebar use;
- the built-in thread list's `sidebar.sectionOrder` preference (project
  entries only; `pinned` and `threads` keep their places).

With `autoSort` on it re-sorts every hour at minute 17, which overwrites a
manual drag of projects. It also sorts once right after install.

## Commands

| Command | Effect |
| --- | --- |
| `bb project-usage-sort preview` | Print the ranking (score, thread count, last use) without changing anything. |
| `bb project-usage-sort apply` | Sort now and report how many projects moved. |

Add `--json` when the output drives code.

## Settings

Change with `bb plugin config project-usage-sort` or Settings → Plugins.

| Setting | Default | Meaning |
| --- | --- | --- |
| `autoSort` | `true` | Re-sort every hour. Off keeps the order until `apply`. |
| `halfLifeDays` | `14` | Smaller values favor recent work more strongly. |
| `includeChildThreads` | `false` | Count child threads too (orchestration fan-out inflates a project). |

Run `preview` before `apply` when the user wants to see the effect first.
