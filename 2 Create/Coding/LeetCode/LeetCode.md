# 🧩 LeetCode

One note per problem, named `<number> <title>`, e.g. `0001 Two Sum` (template: *LeetCode*).

## By difficulty
```dataview
TABLE WITHOUT ID length(rows) AS "Solved"
FROM "2 Create/Coding/LeetCode"
WHERE number
GROUP BY difficulty AS "Difficulty"
```

## By pattern
```dataview
TABLE WITHOUT ID pattern AS "Pattern", length(rows) AS "Problems", rows.file.link AS "Notes"
FROM "2 Create/Coding/LeetCode"
WHERE number
GROUP BY pattern
```

## All problems
```dataview
TABLE number AS "#", difficulty AS "Difficulty", pattern AS "Pattern", date AS "Solved"
FROM "2 Create/Coding/LeetCode"
WHERE number
SORT number ASC
```
