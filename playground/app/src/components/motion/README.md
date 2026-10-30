# Copied beUI source (shadcn style)

These components are copied verbatim from the free, MIT-licensed
[beUI](https://beui.dev) library ([starc007/ui-components](https://github.com/starc007/ui-components)),
the shadcn way — source lives in your repo, not in node_modules. The upstream
MIT license is preserved in `LICENSE` in this directory.

Only free components are used — nothing from beUI Pro (pro.beui.dev) or its
private registry:

- `button` — https://beui.dev/r/button
- `card` — https://beui.dev/r/card
- `alert` — https://beui.dev/r/alert
- `animated-badge` — https://beui.dev/r/animated-badge
- `collapsible` — https://beui.dev/r/collapsible
- `input` — https://beui.dev/r/input
- `animated-toast-stack` — https://beui.dev/r/animated-toast-stack

Shared helpers under `../lib/` (`utils`, `ease`, `presence-gate`,
`hooks/use-hover-capable`, `touch`) are copied from the same repo — beUI
components import them via the `@/` alias.
