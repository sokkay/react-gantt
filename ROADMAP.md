# Roadmap - @sokkay/react-gantt

## Vision

`@sokkay/react-gantt` sera una libreria de componentes para React 18+ enfocada en construir cartas Gantt interactivas, personalizables y controladas por el consumidor.

El objetivo inicial es entregar una base solida para visualizar proyectos y tareas, editar fechas con interacciones directas y permitir que cada aplicacion adapte la experiencia visual y funcional a sus propias necesidades.

## Decisiones Iniciales

- El proyecto sera nuevo, inspirado en `MikaStiebitz/React-Modern-Gantt`, no un fork directo.
- La API sera controlada por callbacks: la libreria emitira eventos y el consumidor mantendra el estado.
- El paquete principal sera `@sokkay/react-gantt`.
- La base tecnica usara monorepo con `pnpm`, TypeScript, React, Tailwind y una demo con Vite.
- La libreria sera compatible con React 18 en adelante.
- Los estilos base se distribuiran con la libreria, evitando exigir una configuracion Tailwind especifica al consumidor.

## MVP v0.1

- [x] Crear el scaffold inicial de la libreria y la demo Vite.
- [x] Renderizar proyectos y tareas en una vista tipo Gantt.
- [x] Soportar vistas por dia, semana, mes, cuarto y ano.
- [x] Permitir mover tareas horizontalmente para cambiar fecha inicial y fecha final manteniendo la duracion.
- [x] Permitir modificar el alcance de una tarea arrastrando el borde inicial o final.
- [x] Emitir callbacks para cambios de movimiento, resize y seleccion.
- [x] Mantener la libreria como componente controlado, sin persistencia interna obligatoria.

## v0.2 UX de Edicion

- [x] Agregar seleccion de tarea.
- [ ] Agregar header o toolbar con iconos y tooltips para acciones sobre la tarea seleccionada.
- [x] Agregar tooltip custom al pasar el mouse sobre cada tarea.
- [x] Agregar menu secundario custom para acciones como copiar, cortar y futuras opciones extensibles.
- [x] Exponer slots o render props para reemplazar las piezas principales de la experiencia.

## v0.3 Reordenamiento

- [x] Permitir mover proyectos de posicion en la columna Y.
- [x] Permitir mover tareas de un proyecto a otro.
- [x] Permitir ordenar tareas dentro de un mismo proyecto.
- [x] Emitir callbacks especificos para reordenamiento de proyectos y transferencia de tareas.
- [x] Mostrar estados visuales claros durante drag, drop y hover.

## v0.4 Personalizacion

- [x] Exponer `renderTask` para personalizar la tarjeta/barra de tarea.
- [x] Exponer `renderTaskTooltip` para personalizar el detalle por hover.
- [x] Exponer `renderContextMenu` para personalizar el menu secundario.
- [x] Exponer `renderSelectionToolbar` para personalizar el toolbar de tarea seleccionada.
- [x] Exponer `renderProjectCell` para personalizar la columna de proyectos.
- [x] Agregar soporte de tema mediante CSS variables, class names y Tailwind.

## v0.5 Escalabilidad

- [x] Agregar virtualizacion para listas grandes de proyectos y tareas.
- [x] Agregar auto-scroll durante drag horizontal y vertical.
- [x] Agregar snapping configurable por unidad de tiempo.
- [x] Optimizar render para evitar recalculos innecesarios en datasets grandes.
- [x] Mantener una API estable para que las mejoras de rendimiento no rompan integraciones existentes.

## v0.6 Planificacion Avanzada

- [ ] Agregar soporte para dependencias entre tareas.
- [ ] Agregar milestones.
- [x] Agregar progreso por tarea.
- [ ] Agregar validaciones opcionales para reglas de negocio.
- [ ] Evaluar exportacion de datos o vistas.
- [ ] Preparar integraciones con estructuras externas de planificacion.

## Testing Inicial

- [x] El inicio del proyecto incluira unit tests para utilidades de fechas, calculos de posicion y transformaciones de datos.
- [x] El inicio del proyecto incluira component tests para render, seleccion, tooltips, menus y callbacks principales.
- [x] No se incluiran tests E2E al inicio.
- [x] Playwright queda como mejora futura cuando la API y las interacciones esten mas estables.

## Referencia

- Proyecto de referencia: `MikaStiebitz/React-Modern-Gantt`.
- Demo de referencia: `https://react-gantt-demo.vercel.app/components#granular-controls`.
- La referencia se usara para inspirar capacidades y decisiones de producto, manteniendo una implementacion propia.
