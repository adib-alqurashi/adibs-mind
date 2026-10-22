# ∫ Calculus

Problem sets with full solutions, following Larson & Edwards, *Calculus: Early Transcendental Functions* (7th edition), one folder per chapter.
Written in Markdown with LaTeX, so it renders on GitHub and in Obsidian: `$f'(x)$` inline, `$$ ... $$` for display.

| Chapter | Title |
| --- | --- |
| [CH01](<CH01 Preparation for Calculus/>) | Preparation for Calculus |
| [CH02](<CH02 Limits and Their Properties/>) | Limits and Their Properties |
| [CH03](<CH03 Differentiation/>) | Differentiation |
| [CH04](<CH04 Applications of Differentiation/>) | Applications of Differentiation |
| [CH05](<CH05 Integration/>) | Integration |
| [CH06](<CH06 Differential Equations/>) | Differential Equations |
| [CH07](<CH07 Applications of Integration/>) | Applications of Integration |
| [CH08](<CH08 Integration Techniques and Improper Integrals/>) | Integration Techniques and Improper Integrals |
| [CH09](<CH09 Infinite Series/>) | Infinite Series |
| [CH10](<CH10 Conics Parametric Equations and Polar Coordinates/>) | Conics, Parametric Equations, and Polar Coordinates |
| [CH11](<CH11 Vectors and the Geometry of Space/>) | Vectors and the Geometry of Space |
| [CH12](<CH12 Vector-Valued Functions/>) | Vector-Valued Functions |
| [CH13](<CH13 Functions of Several Variables/>) | Functions of Several Variables |
| [CH14](<CH14 Multiple Integration/>) | Multiple Integration |
| [CH15](<CH15 Vector Analysis/>) | Vector Analysis |
| [CH16](<CH16 Additional Topics in Differential Equations/>) | Additional Topics in Differential Equations |

## How a section file looks
Inside each chapter, one file per section, named by section number: `8.2.md`, `8.3.md` (template: *Math*).
Each problem is written as **Problem** (the statement), **Idea** (the key insight in one line),
**Solution** (the full working) and **Takeaway** (what to remember next time).

## Sections done
```dataview
TABLE file.folder AS "Chapter", file.mtime AS "Edited"
FROM "2 Create/Math/Calculus"
WHERE file.name != "Calculus"
SORT file.name ASC
```
