DS# 🔎 Research

Documentation and research on any topic I'm curious about — read, understand, then write it up in my own words.
One note per topic (template: *Research*); a topic that grows gets its own folder, like [ML](<ML/ML.md>).

Status: `idea` → `researching` → `writing` → `done`

```dataview
TABLE status AS "Status", topic AS "Topic", file.mtime AS "Edited"
FROM "2 Create/Research"
WHERE file.name != "Research"
SORT choice(status = "done", 1, 0) ASC, file.mtime DESC
```
