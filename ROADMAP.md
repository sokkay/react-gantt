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

- Crear el scaffold inicial de la libreria y la demo Vite.
- Renderizar proyectos y tareas en una vista tipo Gantt.
- Soportar vistas por dia, semana, mes, cuarto y ano.
- Permitir mover tareas horizontalmente para cambiar fecha inicial y fecha final manteniendo la duracion.
- Permitir modificar el alcance de una tarea arrastrando el borde inicial o final.
- Emitir callbacks para cambios de movimiento, resize y seleccion.
- Mantener la libreria como componente controlado, sin persistencia interna obligatoria.

## v0.2 UX de Edicion

- Agregar seleccion de tarea.
- Agregar header o toolbar con iconos y tooltips para acciones sobre la tarea seleccionada.
- Agregar tooltip custom al pasar el mouse sobre cada tarea.
- Agregar menu secundario custom para acciones como copiar, cortar y futuras opciones extensibles.
- Exponer slots o render props para reemplazar las piezas principales de la experiencia.

## v0.3 Reordenamiento

- Permitir mover proyectos de posicion en la columna Y.
- Permitir mover tareas de un proyecto a otro.
- Permitir ordenar tareas dentro de un mismo proyecto.
- Emitir callbacks especificos para reordenamiento de proyectos y transferencia de tareas.
- Mostrar estados visuales claros durante drag, drop y hover.

## v0.4 Personalizacion

- Exponer `renderTask` para personalizar la tarjeta/barra de tarea.
- Exponer `renderTaskTooltip` para personalizar el detalle por hover.
- Exponer `renderContextMenu` para personalizar el menu secundario.
- Exponer `renderSelectionToolbar` para personalizar el toolbar de tarea seleccionada.
- Exponer `renderProjectCell` para personalizar la columna de proyectos.
- Agregar soporte de tema mediante CSS variables, class names y Tailwind.

## v0.5 Escalabilidad

- Agregar virtualizacion para listas grandes de proyectos y tareas.
- Agregar auto-scroll durante drag horizontal y vertical.
- Agregar snapping configurable por unidad de tiempo.
- Optimizar render para evitar recalculos innecesarios en datasets grandes.
- Mantener una API estable para que las mejoras de rendimiento no rompan integraciones existentes.

## v0.6 Planificacion Avanzada

- Agregar soporte para dependencias entre tareas.
- Agregar milestones.
- Agregar progreso por tarea.
- Agregar validaciones opcionales para reglas de negocio.
- Evaluar exportacion de datos o vistas.
- Preparar integraciones con estructuras externas de planificacion.

## Testing Inicial

- El inicio del proyecto incluira unit tests para utilidades de fechas, calculos de posicion y transformaciones de datos.
- El inicio del proyecto incluira component tests para render, seleccion, tooltips, menus y callbacks principales.
- No se incluiran tests E2E al inicio.
- Playwright queda como mejora futura cuando la API y las interacciones esten mas estables.

## Referencia

- Proyecto de referencia: `MikaStiebitz/React-Modern-Gantt`.
- Demo de referencia: `https://react-gantt-demo.vercel.app/components#granular-controls`.
- La referencia se usara para inspirar capacidades y decisiones de producto, manteniendo una implementacion propia.
