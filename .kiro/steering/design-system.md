---
inclusion: always
---

# Design system: neon Halloween

## Palette tokens
| Token | Hex | Use |
| --- | --- | --- |
| `--night` | `#0B0714` | Page background |
| `--ink` | `#1A1030` | Panels |
| `--neon-orange` | `#FF7A00` | Primary accent, pumpkin and lantern glow |
| `--neon-purple` | `#9D4DFF` | Mystery, haunted mansion, crypt |
| `--neon-green` | `#39FF14` | Ghosts, forest, slime |
| `--neon-magenta` | `#FF2BD6` | Highlights, calls to action |
| `--bone` | `#F5F0E6` | Body text on dark |

Each chapter picks one primary and one secondary neon from the table. Declare tokens as CSS variables in one file. Do not hard-code hex values in components.

## Typography
- Display: a spooky but readable display font with an open licence (for example Creepster or Nosifer, SIL OFL). Headings only.
- Body: a clean sans-serif (for example Inter, SIL OFL), at least 16 px.
- Self-host all fonts: download the licensed font files once, commit them under `public/fonts/` (or load with `next/font/local`), and list each in `ASSETS.md` with source and licence. Never load fonts from Google Fonts or another third-party origin at run time, because that sends visitor IPs to a third party (requirement 21.4).

## Contrast
- Body text at least 4.5:1, large text at least 3:1.
- Place narration on a semi-opaque `--ink` panel so it stays readable over any scene.

## Motion rules
- Each scene has parallax layers, fog and particles.
- Scene transitions are 800 ms or less.
- No flashing more than 3 times per second.
- Neon glow outline around the person uses the chapter accent colour.
- `prefers-reduced-motion`: turn off parallax, particle animation and flashes. Use a cross-fade of 200 ms or less.

## Components
- Controls need visible focus rings (2 px, `--neon-magenta`) and keyboard access.
- Decorative layers use `aria-hidden="true"`.

## Spooky design that does real work
- Atmosphere reflects tracking quality: fog thickens and the vignette narrows when the camera cannot see the visitor well (requirement 22).
- Controls are in-world objects with plain text labels: ghost permission prompt, lantern capture button, rune fallback buttons, candle chapter progress (requirements 23 and 24). Theme never replaces the label.
