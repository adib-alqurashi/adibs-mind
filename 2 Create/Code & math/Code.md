# 💻 Code

Programming, problem solving and data science: things I build, document and illustrate.
shipped work and ideas can be find in [code-lab](https://github.com/adib-alqurashi/code-lab).

| Folder | What goes there | Template |
| --- | --- | --- |
| [LeetCode](<LeetCode/LeetCode.md>) | One note per problem: idea, solution, complexity, takeaway | LeetCode |
| `Data Science/` | Analyses, models, Kaggle write-ups, with plots and results | Code Note |
| `Notes/` | Concepts, languages, algorithms — explained with code and diagrams | Code Note |

## Recent
```dataview
TABLE file.folder AS "Folder", file.mtime AS "Edited"
FROM "2 Create/Code"
WHERE file.name != "Code" AND file.name != "LeetCode"
SORT file.mtime DESC
LIMIT 15
```
