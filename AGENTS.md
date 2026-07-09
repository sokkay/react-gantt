# @sokkay/react-gantt - Agent Instructions

Reglas para agentes que trabajen en este repo.

## Idioma

- Responder al usuario en **espanol**.

## Invariantes del Producto

- La libreria debe mantenerse como componente **controlado**: los cambios de
  usuario se emiten por callbacks y el consumidor actualiza `projects`,
  `selectedTaskId`, `collapsedProjectIds` u otros estados.
- No introducir persistencia interna obligatoria ni side effects globales.
- La API publica debe ser estable y explicita. Cambios en exports, props,
  payloads o tipos requieren actualizar README, tests y demo cuando aplique.
- Las fechas aceptan `Date | string | number`, pero la logica interna trabaja
  con fechas normalizadas a inicio de dia.
- Las operaciones de timeline deben respetar los modos `day`, `week`, `month`,
  `quarter` y `year`.
- Los estilos base se distribuyen con la libreria como CSS importable; no exigir
  configuracion Tailwind al consumidor.
- React y React DOM son peer dependencies. No moverlos a dependencies del
  paquete publicable.

## Stack Actual

- Monorepo: pnpm workspaces.
- Paquete publicable: `packages/react-gantt` como `@sokkay/react-gantt`.
- Demo/docs: `apps/docs` con Vite.
- UI: React, TypeScript, CSS generado desde Tailwind.
- Drag and drop: `@dnd-kit`.
- Floating UI: `@floating-ui/react`.
- Fechas: `date-fns`.
- Tests: Vitest, Testing Library y jsdom.
- Build de libreria: `tsup` y `tailwindcss`.

## Estructura del Repositorio

```txt
packages/react-gantt/
  src/
    GanttChart.tsx                # Componente principal
    useGanttChart.ts              # Ref imperativa publica
    types.ts                      # Contrato publico principal
    labels.ts                     # Labels por defecto
    constants.ts                  # Dimensiones base
    components/                   # Piezas UI internas
    hooks/                        # Hooks internos de modelo e interaccion
    utils/                        # Fechas, timeline, layout, theme y helpers
    __tests__/                    # Tests unitarios y de componente
    styles.css                    # Entrada CSS del paquete
apps/docs/
  src/                            # Demo Vite para validar integracion real
```

## Fuentes de Verdad

- API publica y tipos: `packages/react-gantt/src/types.ts`.
- Exports publicos: `packages/react-gantt/src/index.ts`.
- Composicion del chart: `packages/react-gantt/src/GanttChart.tsx`.
- Modelo derivado: `packages/react-gantt/src/hooks/useGanttModel.ts`.
- Interacciones pointer para mover/redimensionar: `packages/react-gantt/src/hooks/useTaskPointerInteraction.ts`.
- Drag end, reorder y transfer: `packages/react-gantt/src/hooks/useGanttDragEnd.ts`.
- Colapso de proyectos: `packages/react-gantt/src/hooks/useProjectCollapse.ts`.
- Resize de sidebar: `packages/react-gantt/src/hooks/useSidebarResize.ts`.
- Normalizacion y snapping de fechas: `packages/react-gantt/src/utils/dates.ts`.
- Timeline y pixeles: `packages/react-gantt/src/utils/timeline.ts`.
- Layout de filas y lanes: `packages/react-gantt/src/utils/layout.ts`.
- Barras resumen de proyectos colapsados: `packages/react-gantt/src/utils/collapsed-summary.ts`.
- Estilos distribuidos: `packages/react-gantt/src/styles.css`.
- Demo de consumo: `apps/docs/src/App.tsx`.

## Convenciones de API

- Mantener payloads de callbacks con objetos nombrados, no listas posicionales.
- Preferir tipos genericos para `meta` de proyectos y tareas antes que `any`.
- Si se agrega una prop nueva, definirla en `GanttChartProps`, documentarla en
  README si es publica y cubrir el comportamiento con tests cuando tenga logica.
- Si se agrega un render prop, pasar datos normalizados y un estado minimo y
  estable.
- No exponer helpers internos desde `index.ts` salvo que sean utiles como API
  publica para consumidores.
- Evitar cambios incompatibles en nombres de clases `sokkay-gantt__*` porque son
  superficie de personalizacion.

## Fechas y Timeline

- Usar `normalizeDate`, `snapDate`, `addViewUnits`, `diffViewUnits` y
  `ensureMinimumRange` en vez de duplicar calculos con `Date` directamente.
- Para semanas, mantener `weekStartsOn: 1` como convencion local.
- Las conversiones entre fechas y pixeles deben pasar por `utils/timeline.ts`.
- Las tareas no deben quedar con rango menor al minimo del modo de vista durante
  resize o snapping.
- Al tocar calculos de fechas, agregar o actualizar tests en
  `packages/react-gantt/src/__tests__/dates.test.ts` o
  `timeline.test.ts`.

## Componentes y Hooks

- `GanttChart.tsx` debe mantenerse como composicion de hooks y componentes
  internos, no como lugar para acumular logica compleja nueva.
- Logica derivada de datos pertenece a `useGanttModel` o `utils/`.
- Logica de interaccion pertenece a hooks especificos en `src/hooks/`.
- Componentes internos deben recibir datos ya normalizados cuando sea posible.
- Mantener el componente compatible con React 18+.
- No leer ni escribir refs durante render.
- Evitar estado interno que duplique props controladas salvo que sea para modo
  no controlado documentado, como `defaultCollapsedProjectIds`.

## UI y Accesibilidad

- Usar labels configurables para texto visible y aria labels cuando el texto sea
  parte de la experiencia publica.
- Mantener estados de seleccion, hover, drag, resize y colapso claramente
  distinguibles.
- Los controles interactivos deben usar `button` cuando corresponda y conservar
  atributos aria existentes.
- Usar `lucide-react` para iconos cuando ya exista un icono adecuado.
- No introducir dependencias visuales pesadas para piezas que pueden resolverse
  con CSS o componentes existentes.
- Validar cambios visuales en `apps/docs` cuando se toquen estilos o layout.

## Estilos y Build

- Editar estilos fuente en `packages/react-gantt/src/styles.css`.
- El CSS distribuible sale de `pnpm --filter @sokkay/react-gantt build:css`.
- Mantener `sideEffects: ["./dist/styles.css"]` en el paquete publicable.
- No depender de clases generadas dinamicamente que Tailwind no pueda detectar.
- Preferir CSS variables ya soportadas por `GanttTheme` para personalizacion de
  colores y dimensiones.

## Testing

Agregar o actualizar tests al cambiar:

- Normalizacion, snapping o calculos de fechas.
- Conversiones fecha/pixel y ancho de timeline.
- Layout de proyectos, lanes o virtualizacion.
- Callbacks de move, resize, reorder, transfer, seleccion o colapso.
- Render props, labels, context menu, tooltips o toolbar.
- API publica o exports.

Verificacion recomendada:

- Cambio puntual de logica del paquete: `pnpm --filter @sokkay/react-gantt test`.
- Cambios de tipos: `pnpm typecheck`.
- Cambios de lint/imports: `pnpm lint`.
- Cambios de build o CSS: `pnpm --filter @sokkay/react-gantt build`.
- Antes de entregar cambios amplios: `pnpm test && pnpm typecheck && pnpm lint`.

Si no se agregan tests para logica compleja, explicar la razon y el riesgo
pendiente en la respuesta final.

## Comandos Frecuentes

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm --filter @sokkay/react-gantt test
pnpm --filter @sokkay/react-gantt build
pnpm --filter docs dev
```

## Release (manual)

El versionado y la publicacion a npm son **100% manuales**. No hay Changesets
ni CI de autopublicacion en GitHub.

Script: `scripts/release.mjs` (via `pnpm release`).

Que hace el script:

- Exige working tree limpio y que el tag `vX.Y.Z` no exista.
- Sube la version de `packages/react-gantt/package.json`
  (`patch` | `minor` | `major` | `x.y.z`).
- Agrega una seccion a `packages/react-gantt/CHANGELOG.md` con los commits
  desde el ultimo tag.
- Crea el commit `chore: release vX.Y.Z` y el tag `vX.Y.Z`.
- **No** hace build, **no** publica a npm y **no** hace `git push`.

Flujo correcto desde `main` limpio:

```bash
pnpm release patch   # o minor | major | x.y.z
pnpm --filter @sokkay/react-gantt build
pnpm --filter @sokkay/react-gantt publish --access public
git push
git push origin vX.Y.Z
```

Reglas para agentes:

- No reintroducir Changesets ni workflows de release en `.github/`.
- No publicar a npm ni crear tags/releases salvo pedido explicito del usuario.
- Si se pide ayuda con una release, seguir este flujo y el script existente.

## Convenciones de Codigo

- TypeScript estricto. Evitar `any`; si se usa, justificarlo.
- Componentes funcionales y hooks idiomaticos de React.
- Cambios minimos y enfocados. No refactorizar codigo no relacionado.
- Preferir imports directos por archivo y evitar barrels nuevos salvo que haya
  un patron local claro.
- Mantener funciones puras en `utils/` cuando no dependan de React.
- No crear commits ni archivos adicionales salvo pedido explicito.
- Actualizar README cuando cambie la forma de uso publica.
