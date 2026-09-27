# Plan de implementación — “Mi Rancho”

## 1. Objetivo

Construir un prototipo funcional, mobile-first y completamente navegable para que Honorio gestione su ganado desde el potrero sin depender de registros en papel. La aplicación permitirá registrar animales y lotes, alimentación, pesos, vacunas, purgas, tratamientos y ventas; procesará esos datos para mostrar costos, alertas, evolución productiva y ganancia neta de manera sencilla.

La primera versión será una PWA local: después de la primera carga podrá abrirse sin conexión, conservará sus datos en el dispositivo y no requerirá autenticación ni backend.

## 2. Alcance funcional del MVP

### Navegación principal

Usar una aplicación de una sola página con cuatro destinos persistentes en una barra inferior:

1. **Inicio**
2. **Ganado**
3. **Registrar** — acción central visualmente destacada
4. **Resumen**

El encabezado mostrará el nombre “Mi Rancho”, estado de conectividad y acceso a ajustes. No se añadirá React Router: un estado interno de navegación será suficiente para este prototipo y evitará una dependencia innecesaria.

### Inicio

- Saludo a Honorio y fecha actual.
- Resumen inmediato: animales activos, lotes, alertas pendientes y costos del mes.
- Acciones rápidas: registrar alimento, peso, vacuna/purga, tratamiento y venta.
- Alertas veterinarias ordenadas por vencimiento.
- Actividad reciente con acceso al detalle correspondiente.
- Estado vacío útil si el usuario elimina los datos de demostración.

### Ganado

- Selector entre **Animales** y **Lotes**.
- Búsqueda por chapeta, nombre o lote y filtros por estado/lote.
- Listado de animales con chapeta, peso actual, lote y estado.
- Listado de lotes con cantidad de animales, peso promedio y costo acumulado.
- Formularios para crear y editar animales y lotes.
- Ficha de animal con datos básicos, evolución de peso, costo acumulado e historial cronológico.
- Ficha de lote con integrantes, métricas agregadas e historial.
- Los animales vendidos permanecen consultables, pero no aparecen como objetivos de nuevos registros operativos.

### Registro rápido

Flujo corto, optimizado para una mano:

1. Elegir tipo de registro.
2. Elegir objetivo: animal individual o lote.
3. Completar únicamente los campos relevantes.
4. Revisar un resumen breve y guardar.
5. Mostrar confirmación y acceso para ver el registro.

Tipos y campos:

- **Alimento:** fecha, cantidad en kg, producto/tipo, costo total y notas opcionales.
- **Peso:** fecha, peso en kg y notas; actualiza el peso vigente de cada animal afectado.
- **Vacuna:** fecha, producto, dosis opcional, costo total, próxima aplicación y notas.
- **Purga:** fecha, producto, dosis opcional, costo total, próxima aplicación y notas.
- **Tratamiento:** fecha, motivo, producto/procedimiento, costo total, próxima revisión opcional y notas.
- **Venta:** fecha, uno o varios animales activos, comprador opcional, peso vendido opcional, valor total y notas.

Los formularios validarán valores positivos, fechas válidas, chapetas únicas y selección de al menos un objetivo. Los errores aparecerán junto al campo y el botón principal permanecerá visible sin depender solo de un mensaje global.

### Resumen y finanzas

- Alternancia entre vistas de **Producción** y **Finanzas**.
- Producción: animales activos, peso promedio, variación reciente de peso, alimento registrado y próximos controles.
- Finanzas: ingresos por ventas, costos de alimentación, costos veterinarios y ganancia neta.
- Desglose por periodo reciente y por lote.
- Historial de ventas con ingreso, costo atribuido y utilidad.
- Gráficos simples construidos con CSS/SVG propio, sin añadir una biblioteca de visualización.

### Ajustes

- Datos básicos de la finca y nombre del productor.
- Indicador de almacenamiento local y conectividad.
- Acción para restaurar los datos de demostración, protegida por confirmación.
- No se incluirán usuarios, roles, sincronización en la nube ni contabilidad avanzada.

## 3. Modelo de datos y reglas de negocio

Definir tipos TypeScript para:

- `RanchProfile`: nombre de la finca, productor, moneda y unidad de peso.
- `Lot`: identificador, nombre, descripción opcional, fecha de creación y estado.
- `Animal`: identificador, chapeta única, nombre opcional, sexo, raza, fecha de nacimiento opcional, fecha de ingreso, peso inicial/actual, lote y estado (`active` o `sold`).
- `Activity`: tipo, fecha, objetivo original, animales afectados, campos específicos, costo y notas.
- `Sale`: fecha, animales, comprador, valor de venta, peso opcional, costo atribuido congelado y utilidad neta.
- `Alert`: derivada de próximas fechas veterinarias, no duplicada como estado independiente.

Reglas:

- Un registro por lote toma una instantánea de los animales activos pertenecientes al lote en ese momento.
- Su costo total se reparte en partes iguales entre esos animales y la asignación queda guardada; cambios posteriores de lote no alteran costos históricos.
- Un registro individual atribuye todo su costo al animal seleccionado.
- Las actividades sin costo se admiten y cuentan en el historial, pero no en los totales financieros.
- La venta calcula `utilidad neta = valor de venta - costos acumulados atribuidos` de los animales vendidos y guarda esa base de costo como instantánea.
- Al confirmar una venta, los animales pasan a estado `sold`; la operación pedirá confirmación y no podrá seleccionar animales ya vendidos.
- El peso más reciente por fecha determina el peso actual. Si se elimina o modifica un registro de peso, se recalcula a partir del historial, usando el peso inicial como respaldo.
- Las alertas se generan para próximas aplicaciones o revisiones de animales activos y se clasifican como vencidas, próximas o futuras.
- Formatear moneda con `Intl.NumberFormat("es-CO", { currency: "COP" })`, peso en kg y fechas visibles en formato día/mes/año.

## 4. Persistencia y modo offline

- Crear un estado global pequeño con Context + `useReducer`; separar acciones de dominio de los componentes visuales.
- Persistir una única estructura versionada en `localStorage`, por ejemplo `mi-rancho:v1`.
- Inicializar con datos de demostración editables para Honorio: varios lotes, animales activos, registros recientes, alertas y al menos una venta.
- Manejar datos ausentes o corruptos restaurando la semilla de forma segura sin romper la interfaz.
- Añadir `vite-plugin-pwa` y configurar:
  - manifiesto con nombre “Mi Rancho”, nombre corto, color de tema, color de fondo y modo `standalone`;
  - service worker con precaché de la aplicación y actualización automática;
  - ícono vectorial propio, simple y legible, con variantes `any` y `maskable`;
  - soporte del service worker en desarrollo para validar el comportamiento desde la vista previa.
- Mostrar estado `Sin conexión` cuando `navigator.onLine` sea falso. Todos los registros seguirán funcionando porque no habrá llamadas de red.
- No implementar sincronización remota ni resolución de conflictos en este MVP.

## 5. Dirección visual y experiencia móvil

- Identidad: **Mi Rancho**, rural contemporánea, cercana y profesional.
- Paleta: verde bosque como color primario, fondos crema cálidos, superficies blancas, acento tierra/mostaza y rojo reservado para vencimientos o acciones destructivas.
- Tipografía: pila de sistema legible para mantener la experiencia completamente offline y evitar recursos tipográficos externos.
- Diseño pensado primero para 360–430 px, con contenido centrado y ancho máximo controlado en pantallas grandes.
- Barra inferior fija respetando `safe-area-inset-bottom`; encabezado compacto y tarjetas con jerarquía clara.
- Controles táctiles de al menos 44 px, texto base de al menos 16 px en campos, contraste AA, etiquetas visibles y estados de foco.
- Formularios organizados en paneles o pantallas completas móviles; evitar modales pequeños y tablas horizontales.
- Iconografía coherente mediante `lucide-react`; no usar emojis como sustitutos de iconos.
- Animaciones discretas para cambios de vista, confirmaciones y expansión de contenido, respetando `prefers-reduced-motion`.
- Incluir estados vacíos, confirmaciones de guardado, errores inline y confirmación antes de venta o restauración de datos.

## 6. Estructura de implementación

Mantener `src/main.tsx` como punto de entrada y extender el proyecto con una organización acotada:

- `src/App.tsx`: composición del proveedor, shell móvil y navegación de vistas.
- `src/types.ts`: contratos del dominio.
- `src/data/seed.ts`: perfil y datos de demostración.
- `src/state/RanchContext.tsx`: reducer, persistencia, migración/versionado y acciones.
- `src/lib/format.ts`: moneda, fechas, pesos e identificadores.
- `src/lib/metrics.ts`: costos, utilidad, alertas y agregados.
- `src/components/`: shell, barra inferior, encabezado, tarjetas, estados y controles compartidos.
- `src/screens/`: Inicio, Ganado, detalle de animal/lote, Registro, Resumen y Ajustes.
- `src/index.css`: import de Tailwind, variables de tema, estilos base no invasivos, safe areas y utilidades específicas.
- `public/`: manifiesto/ícono si la configuración PWA no los genera directamente.
- `vite.config.ts`: integración de PWA sin alterar los plugins existentes de Figma Make.
- `.figma/make/site.json`: actualizar descripción y metadatos visibles para “Mi Rancho”, conservando la configuración de privacidad existente.

Añadir únicamente las dependencias `lucide-react` y `vite-plugin-pwa`, actualizando `package.json` y `pnpm-lock.yaml` mediante pnpm.

## 7. Orden de construcción paso a paso

### Etapa 1 — Fundaciones

- Crear tema, tipos, datos semilla, utilidades de formato y estado persistente.
- Construir shell móvil, navegación inferior, encabezado y detección de conectividad.
- Dejar las cuatro rutas internas navegables con estados vacíos temporales.

### Etapa 2 — Inicio

- Implementar métricas, alertas, actividad reciente y accesos rápidos.
- Conectar cada acceso con el formulario de registro ya preseleccionado.

### Etapa 3 — Ganado

- Implementar listados, búsqueda, filtros, creación/edición y fichas de animal/lote.
- Verificar chapetas únicas, reasignación de lote y estados activo/vendido.

### Etapa 4 — Registros de campo

- Construir el flujo común y los campos específicos para alimento, peso, vacuna, purga y tratamiento.
- Aplicar instantáneas de integrantes y reparto igual de costos.
- Actualizar historiales, pesos, alertas y métricas al guardar.

### Etapa 5 — Ventas y resumen

- Implementar venta individual o múltiple, confirmación, cálculo de costos y utilidad.
- Construir paneles de producción/finanzas e historial de ventas.

### Etapa 6 — PWA y acabados

- Configurar manifiesto, ícono, service worker y actualización automática.
- Completar ajustes, restauración de demostración, estados vacíos, feedback, transiciones y accesibilidad.
- Ajustar la presentación en móvil y el contenedor de escritorio sin convertirla en una interfaz desktop separada.

## 8. Verificación

Usar la vista previa como señal principal y revisar manualmente:

- Anchos de 360, 390 y 430 px, más una vista de escritorio centrada.
- Navegación entre todos los destinos y retorno desde detalles/formularios.
- Alta y edición de animal/lote; rechazo de chapetas repetidas.
- Registro individual y por lote para cada tipo de actividad.
- Reparto exacto de costos por lote y conservación histórica al mover un animal.
- Actualización del peso vigente y métricas después de registrar un pesaje.
- Generación de alertas vencidas y próximas.
- Venta: cálculo de utilidad, cambio de estado y exclusión de nuevos registros.
- Persistencia después de recargar y restauración de datos de demostración.
- Apertura y operación sin red después de una primera carga, incluyendo recarga offline.
- Navegación por teclado, foco visible, etiquetas de formularios, contraste y reducción de movimiento.

Por tratarse de un cambio amplio y de configuración PWA, ejecutar también `pnpm build`. Corregir cualquier fallo de TypeScript/Vite y confirmar que se generen el manifiesto y el service worker. No iniciar otro servidor de desarrollo, porque el servidor Vite de Figma Make ya está activo.

## 9. Criterios de aceptación

- El prototipo se entiende y puede usarse en español sin instrucciones externas.
- Todas las tareas principales se completan desde un celular con pocos pasos y controles táctiles grandes.
- Se pueden gestionar animales y lotes, registrar las cinco actividades de campo y realizar ventas.
- Inicio y Resumen reaccionan inmediatamente a los datos guardados.
- Las utilidades descuentan costos reales atribuidos y mantienen instantáneas históricas coherentes.
- Los datos sobreviven a una recarga y la app vuelve a abrirse sin conexión tras la primera visita.
- La interfaz presenta una identidad coherente de “Mi Rancho”, no utiliza emojis y mantiene accesibilidad básica.
- No se introduce backend, autenticación, sincronización en nube ni funciones contables fuera del alcance acordado.
