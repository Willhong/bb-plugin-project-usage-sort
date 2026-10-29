# bb-plugin-project-usage-sort

Sorts bb's project order by how often each project is used.

Every thread adds a weight of `0.5^(days since last update / halfLifeDays)` to
its project; projects are ordered by the total. The order is written to the
server's project order (project pickers, BB Sidebar) and to the built-in thread
list's `sidebar.sectionOrder`. With `autoSort` on it re-sorts hourly.

```
bb plugin install .
bb project-usage-sort preview   # ranking only
bb project-usage-sort apply     # sort now
```

Settings: `autoSort` (default on), `halfLifeDays` (14), `includeChildThreads` (off).

Development: `npm run typecheck`, `npm test`, `bb plugin build`.
