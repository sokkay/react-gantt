# Roadmap - @sokkay/react-gantt (v2)

## Vision

`@sokkay/react-gantt` es una libreria de componentes para React 18+ enfocada en construir cartas Gantt interactivas, altamente optimizadas, personalizables y 100% controladas por el consumidor.

Este documento actua como un backlog/listado de caracteristicas pendientes del core anterior y las nuevas propuestas de uso, permitiendo al desarrollador priorizar e implementar los items de forma independiente.

---

## Logros Completados (Roadmap v1)

- **Estructura y Core:** Monorepo con `pnpm`, soporte de TypeScript, React 18+, y estilos base CSS que no exigen configuracion de Tailwind en el consumidor.
- **Visualizacion y Tiempos:** Renderizado de proyectos y tareas con soporte de multiples vistas (dia, semana, mes, trimestre y ano).
- **Interacciones Directas:** Drag and drop y resize de tareas mediante eventos pointer con snapping configurable.
- **Orden y Estructura:** Reordenamiento vertical de proyectos, ordenamiento de tareas en el mismo carril y transferencia de tareas entre diferentes proyectos.
- **Personalizacion Extrema:** Slots y render props para elementos principales (`renderTask`, `renderTaskTooltip`, `renderContextMenu`, `renderSelectionToolbar`, `renderProjectCell`).
- **Rendimiento:** Virtualizacion vertical y horizontal para grandes volumenes de datos y auto-scroll inteligente durante interacciones de arrastre.

---

## Listado de Features Pendientes (Backlog v2)

### 1. Control de Edición y Permisos
- [ ] **Modo `readOnly` global y granular**
  - Deshabilitar toda edicion de golpe: `<GanttChart readOnly />`.
  - O dar control preciso por accion mediante objeto:
    ```tsx
    editable={{ move: false, resize: false, transfer: false, reorder: false }}
    ```
- [ ] **Bloqueo individual de tareas (Task locking)**
  - Atributo en el modelo de la tarea para deshabilitar edicion de forma individual (util para tareas cerradas o ya ejecutadas):
    ```ts
    task.locked = true
    task.resizable = false
    task.draggable = false
    ```

### 2. Eventos y Callbacks
- [ ] **Eventos de accion directa sobre elementos**
  - Callbacks para eventos click sin requerir seleccion previa o barras de herramientas:
    ```ts
    onTaskClick?: (task: GanttTask, event: React.MouseEvent) => void;
    onTaskDoubleClick?: (task: GanttTask, event: React.MouseEvent) => void;
    onProjectClick?: (project: GanttProject, event: React.MouseEvent) => void;
    ```
- [ ] **Payloads con objetos completos y tipados en callbacks**
  - Modificar callbacks de mutacion (`onTaskMove`, `onTaskResize`, `onTaskTransfer`) para que pasen las entidades completas y su `meta` tipado, en lugar de solo IDs de referencia:
    ```ts
    onTaskMove?: (payload: { task: GanttTask<TMeta>; project: GanttProject<PMeta>; start: Date; end: Date }) => void;
    ```

### 3. Navegación, Zoom y Rango Visual
- [ ] **Metodos imperativos de UI en la ref publica**
  - Exponer helpers en `ganttRef` para permitir al consumidor crear controles de navegacion externos:
    ```ts
    ganttRef.current?.scrollToToday()
    ganttRef.current?.fitToRange()
    ganttRef.current?.zoomIn()
    ganttRef.current?.zoomOut()
    ```
- [ ] **Configuracion del rango visible y centrado inicial**
  - Diferenciar las fechas limite del timeline de la fecha en la que se debe inicializar el scroll (ej: ver todo el ano pero iniciar posicionado en el mes actual):
    ```tsx
    timelineStart={...}
    timelineEnd={...}
    initialScrollDate={...}
    ```

### 4. Localización y Formateo
- [ ] **Soporte de localizacion nativa (Locale)**
  - Prop `locale` (ej. `"es"`) para internacionalizar headers de forma nativa sin obligar a usar custom renderers.
- [ ] **Formateadores especificos de fecha**
  - Prop `dateFormatters` para personalizar textos por nivel de zoom (mes, semana, dia) de manera declarativa:
    ```tsx
    dateFormatters={{ month: (date) => string }}
    ```

### 5. Estados Visuales y UX
- [ ] **Empty State Nativo**
  - Render prop para disenar la UI cuando la lista de proyectos y tareas esta vacia:
    ```tsx
    renderEmptyState={() => <CustomEmptyState />}
    ```

### 6. Planificación Avanzada
- [ ] **Dependencias entre tareas**
  - Visualizacion grafica de relaciones de precedencia (ej. Finish-to-Start) mediante lineas de conexion en el timeline.
- [ ] **Milestones (Hitos)**
  - Representacion visual de eventos puntuales de duracion cero.
- [ ] **Validaciones de negocio dinamicas en callbacks**
  - Permitir interceptar e impedir movimientos/resizes basados en reglas personalizadas (ej. validar que una tarea no se extienda mas alla del limite del proyecto).
- [ ] **Exportacion de datos y vistas**
  - Facilitar la exportacion o impresion del grafico a PDF/imagen y la exportacion de datos del Gantt.

---

## Estrategia de Testing y Calidad

- **Tests de Integridad:** Mantener cubiertos con unit tests los calculos de fechas, snapping y transformaciones.
- **Tests de Interaccion:** Probar con `@testing-library/react` los nuevos flags (`readOnly`, `editable`, `locked`) y la correcta emision de callbacks tipados.
- **E2E Testing:** Integrar Playwright en el futuro para validar auto-scrolls, drag and drop con virtualizacion, y scrollbars complejos.
