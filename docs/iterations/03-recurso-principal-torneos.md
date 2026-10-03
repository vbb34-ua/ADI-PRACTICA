# Iteración 03 - Recurso Principal: CRUD, Filtros y Paginación de Torneos

## SPEC

### Objetivo
Desarrollar la capa de servicios para el recurso principal de la aplicación (**Torneos**), implementando operaciones de creación con validaciones de negocio, listado paginado, búsqueda por filtros, obtención de detalle con recursos secundarios asociados, y actualización/eliminación con control de autoría.

### Requisitos Funcionales y Técnicos
- **Creación (`crearTorneo`):** Recibe un objeto con los datos del torneo. Valida longitud del título (4-100 caracteres), videojuego obligatorio, plazas mínimas (`plazas_max >= 2`) y fecha de inicio válida. Asigna el `organizador_id` al usuario autenticado.
- **Listado y Paginación (`listarTorneos`):** Parámetros `page` y `pageSize`, calculando rangos `from` y `to`. Permite filtrar por `videojuego` y `estado` (`inscripcion_abierta`, `en_curso`, `finalizado`). Retorna `torneos`, `total`, `page`, `pageSize` y `totalPages`.
- **Búsqueda (`buscarTorneos`):** Búsqueda flexible por texto en título o descripción.
- **Detalle con Recurso Secundario (`obtenerTorneoPorId`):** Obtiene el torneo por su ID y realiza el join/carga de sus **inscripciones asociadas** (con datos de los equipos) y de las **partidas**.
- **Modificación (`actualizarTorneo`):** Permite actualizar datos del torneo verificando que el usuario que ejecuta la acción sea el organizador (`organizador_id`).
- **Eliminación (`eliminarTorneo`):** Permite borrar el torneo previa verificación de que el usuario es el organizador.

### Fuera de Alcance
- Generación automática de cuadro de llaves/brackets (planificado para fases avanzadas).

---

## PLAN
1. Crear el archivo `src/services/torneoService.js`.
2. Implementar `crearTorneo` con validaciones de campos y manejo de errores.
3. Implementar `listarTorneos` integrando paginación con `.range(desde, hasta)` y filtros de Supabase.
4. Implementar `obtenerTorneoPorId` con carga anidada de la relación `inscripciones(id, estado, equipo:equipos(...))`.
5. Implementar `actualizarTorneo` y `eliminarTorneo` comprobando la identidad del organizador.
6. Crear `tests/torneoService.test.js` con pruebas para cada operación y regla de autorización.

---

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Creación con título corto (<4 car.) | Excepción: "El título del torneo es obligatorio..." | Cumplido |
| Creación sin videojuego | Excepción: "Debe especificar un videojuego válido..." | Cumplido |
| Creación con plazas_max < 2 | Excepción: "El número de plazas máximas debe ser..." | Cumplido |
| Creación con fecha inválida | Excepción: "La fecha de inicio no tiene un formato válido." | Cumplido |
| Creación exitosa con datos correctos | Retorna el objeto del torneo con ID y estado por defecto | Cumplido |
| Listado paginado (page=1, pageSize=2) | Retorna array de longitud <= 2 con metadatos total y totalPages | Cumplido |
| Filtro por videojuego (CS2) | Retorna únicamente torneos de Counter-Strike 2 | Cumplido |
| Filtro por estado (finalizado) | Retorna únicamente torneos con estado 'finalizado' | Cumplido |
| Detalle de torneo con recursos secundarios | Retorna objeto del torneo conteniendo array `inscripciones` y `partidas` | Cumplido |
| Modificación por el organizador | Actualiza los datos y devuelve el registro modificado | Cumplido |
| Modificación por usuario ajeno | Lanza excepción: "Acceso denegado: solo el organizador..." | Cumplido |
| Eliminación por usuario ajeno | Lanza excepción de acceso denegado | Cumplido |
| Eliminación por organizador | Elimina el registro y confirma con `{ exito: true }` | Cumplido |

### Tests automáticos
- `tests/torneoService.test.js`: 14 pruebas automatizadas con Vitest cubriendo validaciones, paginación, filtros y seguridad.

---

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity IDE
- Modelo: Gemini 3.8 Flash
- Tipo: Asistente AI de arquitectura y testing

### Uso realizado
- Redacción de la lógica de paginación (`from`/`to`) para Supabase PostgREST.
- Implementación de la carga de recursos secundarios anidados mediante `select('*, inscripciones(*, equipos(*))')`.
- Creación de los casos de prueba de autorización en `torneoService.test.js`.

### Prompt importante
> "Desarrolla torneoService.js cumpliendo todos los requerimientos de la práctica 1 para el recurso principal: crear con validación, listar paginado con filtros, obtener por ID con recursos secundarios relacionados (inscripciones), actualizar y eliminar con comprobación de organizador."

### Resultado
La IA generó el servicio completo y desacoplado, asegurando que ante cualquier error de red o base de datos se lance un error descriptivo en español.

### Decisión del estudiante
Se decidió permitir que `organizadorId` se pase explícitamente o se resuelva mediante la sesión activa del cliente Supabase, maximizando la flexibilidad tanto en entornos de prueba como en producción.

### Correcciones manuales
Se ajustó el fallback de consulta de torneos para prevenir errores cuando la relación foránea de perfiles en PostgREST se consulte sin alias.

---

## COMMITS RELACIONADOS
- `ec963de` - feat(torneos): Iteracion 03 - CRUD, filtros, paginacion y detalle con relaciones del recurso principal
