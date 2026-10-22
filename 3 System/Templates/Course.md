---
course: 
title: ""
term: 
---
# 📘 COURSE CODE — Title

## Info
- Instructor:
- Textbook:
- Grading:

## Open tasks
```tasks
not done
tags include #coursetag
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
WHERE course = this.course
SORT date ASC
```

## Files
| Folder | What goes there |
| --- | --- |
| `Notes/` | Lecture notes, one per week or topic (template: *Lecture Note*) |
| `Assignments/` | Homework, labs and my solutions |
| `Exams/` | Summaries, past papers, practice |
| `Materials/` | Slides, question banks, syllabus — **on this computer only, not on GitHub** |

```dataview
TABLE file.folder AS "Folder", file.mtime AS "Edited"
WHERE startswith(file.folder, this.file.folder + "/")
SORT file.folder ASC, file.name ASC
```

## Questions to ask
-
