# Copied beUI source (shadcn style)

These components are copied verbatim from the free, MIT-licensed
[beUI](https://beui.dev) library ([starc007/ui-components](https://github.com/starc007/ui-components)),
the shadcn way — source lives in your repo, not in node_modules. The upstream
MIT license is preserved in `LICENSE` in this directory.

Only free components — nothing from beUI Pro (pro.beui.dev) or its private
registry. Rendered by the playground:

- `button` — https://beui.dev/r/button
- `animated-badge` — https://beui.dev/r/animated-badge
- `collapsible` — https://beui.dev/r/collapsible
- `input` — https://beui.dev/r/input
- `animated-toast-stack` — https://beui.dev/r/animated-toast-stack

Also copied (pulled in as registry dependencies of the above): `card`,
`alert`, `checkbox`, `switch`, `magnetic`. Unused files are tree-shaken out
of the build.

Shared helpers under `../lib/` (`utils`, `ease`, `presence-gate`,
`hooks/use-hover-capable`, `touch`) are copied from the same repo — beUI
components import them via the `@/` alias.
