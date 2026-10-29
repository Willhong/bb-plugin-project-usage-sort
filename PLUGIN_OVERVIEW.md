## What you get

- **Projects ranked by real use.** Every thread adds weight to its project, and that weight halves every 14 days since the thread was last updated. A project you open every day climbs past one you used heavily last quarter.
- **The order bb already uses.** The ranking is written to bb's own project order, so the new-thread project picker and sidebars that list projects in bb's order show it. The built-in thread list's project sections follow it too; pinned threads and loose threads keep their places.
- **Kept current.** It sorts once when installed and again every hour, at minute 17.

## Commands

- `bb project-usage-sort preview` prints the ranking with each project's score, thread count, and last use, and changes nothing.
- `bb project-usage-sort apply` sorts now and reports how many projects moved.

Add `--json` to either command for machine-readable output. Agents get a bundled skill that explains both commands.

## Settings

- **Sort automatically every hour** (on). Turn it off to keep the order until you run `apply`.
- **Usage half-life (days)** (14). A smaller value favors recent work more strongly.
- **Count child threads** (off). Off counts only threads you started, so a parent that fans out many child threads does not inflate its project.

## Good to know

- Automatic sorting replaces a project order you set by dragging. Turn it off if you want to keep a manual order.
- Active and archived threads count; hidden threads do not. The personal project cannot be reordered and stays where bb puts it.
- Everything runs on your bb server. The plugin calls no external service.
