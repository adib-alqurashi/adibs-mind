---
title: "📝 Daily"
allDay: true
type: single
date: {{date:YYYY-MM-DD}}
study_hours: 
---
# {{date:dddd, D MMMM YYYY}}

## ✅ To-do
- [ ] 

## 📌 Also on today
```tasks
not done
(due on {{date:YYYY-MM-DD}}) OR (scheduled on {{date:YYYY-MM-DD}})
path does not include Calendar/Daily
sort by priority
hide toolbar
hide backlinks
hide edit button
hide postpone button
hide task count
```

## ⏰ Deadlines — next 7 days
```dataview
TABLE date AS "Date", course AS "Course", kind AS "Type"
FROM "1 Organize/Calendar/Deadlines"
WHERE date >= this.date AND date <= this.date + dur(7 days)
SORT date ASC
```

## 🔁 Habits
```habittracker
{
  "path": "1 Organize/Tracker/Habits",
  "daysToShow": 7,
  "lastDisplayedDate": "{{date:YYYY-MM-DD}}"
}
```

## 📝 Notes


## 🌙 End of day
- Fill `study_hours` at the top
- What went well / what to fix tomorrow:
