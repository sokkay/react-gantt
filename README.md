# @sokkay/react-gantt

Monorepo for the publishable package `@sokkay/react-gantt`.

- `packages/react-gantt` — npm package (API, CSS, `llms.txt`)
- `apps/docs` — local Vite demo (not published)

## Install (consumers)

```bash
pnpm add @sokkay/react-gantt
```

```tsx
import { GanttChart } from "@sokkay/react-gantt";
import "@sokkay/react-gantt/styles.css";
```

Agent / IDE context after install:

- `node_modules/@sokkay/react-gantt/llms.txt`
- `node_modules/@sokkay/react-gantt/dist/index.d.ts`
- `node_modules/@sokkay/react-gantt/README.md`
- `node_modules/@sokkay/react-gantt/CHANGELOG.md`

See [`packages/react-gantt/README.md`](./packages/react-gantt/README.md) for the
package overview.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
```

## License

MIT
