# Art direction (derived from the client's HTML design)

Concept: a calm, official "green ledger" — government-grade trust, dark forest sidebar, paper-warm gray canvas, white cards with hairline borders. No gradients, no glows, no shadows on cards. Density is medium; Bengali text needs ≥1.5 line-height.

## Tokens
| Role | Hex | Note |
|---|---|---|
| canvas | #F5F6F3 | page background |
| surface | #FFFFFF | cards, inputs |
| line | #E1E4DE | hairline borders |
| line-strong | #D8DBD5 | dashed dropzones, disabled circles |
| ink | #171B19 | text 17.4:1 |
| ink-2 | #3B423E | long-form body |
| muted | #5C665F | secondary text 5.5:1 on canvas |
| faint | #626C65 | tertiary (was #9AA39C, failed AA) |
| primary | #0F6A4C | actions, links; hover #0B4F39; tint #E7F3EC |
| sidebar | #10231C | active #17352A, text #CFE0D8, muted #8FA79A, dot #4B6259, dot-active #4ADE80, rule #1E3A30 |
| new | #2457C1 on #E4ECFC | |
| progress | #8A5A06 on #FBEDD3 | |
| resolved | #157A45 on #DFF3E6 | |
| danger/rejected | #C22C22 on #FBE4E1 | |

Type: Noto Sans Bengali 400/500/600/700. Scale: caption 12, small 13, body 14, lead 15, h3 16, brand 19, h2 22, title 24, stat 32.
Radii: 8 controls, 12 cards, 14 form card, 999 pills. Spacing 4px base. Focus: 2px primary ring, 2px offset.
Motion: 150ms ease-out color/opacity transitions only; disabled under `prefers-reduced-motion`.
Mobile: sidebar → slide-in drawer < 1024px; tables → stacked cards < 768px; tap targets ≥ 44px.
