---
course: DATA 211
title: "Data Science"
term: 261
---
# 📘 DATA 211 — Data Science

## Info
- Grading (Lec 1 slides): Homework 5% · Quizzes 10% · Project 20% (groups of 4–5) · Midterm 20% · Final 40% · Participation 5%
- ⚠️ No DATA 211 syllabus in 01Academic — dates come from your plan

## Open tasks
```tasks
not done
tags include #data211
sort by due
hide toolbar
hide backlinks
hide edit button
hide postpone button
hide task count
```

## Exams & deadlines
```dataview
TABLE date AS "Date", kind AS "Type", file.link AS "Note"
FROM "1 Organize/Calendar/Deadlines"
WHERE course = "DATA 211"
SORT date ASC
```

## Files
| Folder | What goes there |
| --- | --- |
| `Notes/` | Lecture notes, one per week or topic (template: *Lecture Note*) |
| `Assignments/` | Homework, labs and my solutions |
| `Exams/` | Summaries, past papers, practice |
| `Materials/` | Slides, question banks — **on this computer only, not on GitHub** |

```dataview
TABLE file.folder AS "Folder", file.mtime AS "Edited"
WHERE startswith(file.folder, this.file.folder + "/")
SORT file.folder ASC, file.name ASC
```

## Questions to ask
-
