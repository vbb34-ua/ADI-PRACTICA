# Iteración 04 - Recursos Secundarios: Equipos e Inscripciones

## SPEC

### Objetivo
Implementar la capa de servicios para los recursos secundarios de la plataforma (**Equipos** e **Inscripciones**), asegurando el control de aforo por torneo, verificación del rol de capitán y políticas de cancelación seguras.

### Requisitos Funcionales y Técnicos
- **Gestión de Equipos (`equipoService`):**
  - Creación de equipos validando que el nombre tenga entre 3 y 50 caracteres y el tag/siglas entre 2 y 6 caracteres en mayúsculas.
  - Asignación obligatoria del usuario creador como capitán (`capitan_id`).
  - Obtención de equipo por ID y listado de equipos por capitán.
- **Gestión de Inscripciones (`inscripcionService`):**
  - `inscribirEquipo({ torneoId, equipoId, capitanId })`: Valida que el usuario sea el capitán del equipo, que el torneo esté en estado `'inscripcion_abierta'` y que no se sobrepase el número de plazas máximas (`plazas_max`).
  - `listarInscripcionesTorneo(torneoId)`: Lista los equipos inscritos a un torneo determinado.
  - `cancelarInscripcion(inscripcionId, usuarioId)`: Permite eliminar la inscripción únicamente si el usuario es el capitán del equipo inscrito o el organizador del torneo.

### Fuera de Alcance
- Traspaso de capitanía entre miembros de un equipo (se mantiene 1 capitán fijo).
- Pago de cuotas de inscripción.

---

## PLAN
1. Desarrollar `src/services/equipoService.js` con las operaciones sobre escuadras.
2. Desarrollar `src/services/inscripcionService.js` incorporando las validaciones de cupo, estado de torneo y capitanía.
3. Crear el archivo `src/services/index.js` como punto de entrada centralizado para toda la capa de servicios.
4. Elaborar la suite de pruebas unitarias `tests/inscripcionService.test.js`.
5. Ejecutar la suite y verificar que se cumplen todas las reglas de negocio.

---

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Crear equipo con tag inválido (<2 o >6 car.) | Lanza excepción: "El tag o siglas del equipo debe tener..." | Cumplido |
| Crear equipo con datos válidos | Retorna equipo con capitán asignado y tag en mayúsculas | Cumplido |
| Obtener equipo por ID | Retorna datos del equipo y capitán | Cumplido |
| Inscripción intentada por usuario no capitán | Lanza excepción: "Acceso denegado: solo el capitán..." | Cumplido |
| Inscripción en torneo no abierto (cerrado/finalizado) | Lanza excepción indicando estado no admisible | Cumplido |
| Inscripción en torneo que superó plazas_max | Lanza excepción: "El torneo ha alcanzado su cupo máximo..." | Cumplido |
| Inscripción válida con cupo disponible | Crea registro con estado 'confirmada' | Cumplido |
| Listado de inscripciones de un torneo | Retorna array con los equipos participantes | Cumplido |
| Cancelación de inscripción por capitán | Elimina la inscripción y confirma éxito | Cumplido |
| Cancelación intentada por usuario no autorizado | Lanza excepción de denegación de acceso | Cumplido |

### Tests automáticos
- `tests/inscripcionService.test.js`: 10 pruebas automatizadas con Vitest cubriendo reglas de cupo, capitanía y ciclo de vida de inscripciones.

---

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity IDE
- Modelo: Gemini 3.8 Flash
- Tipo: Asistente AI de arquitectura y testing

### Uso realizado
- Implementación de las verificaciones de relaciones entre entidades (`capitan_id` en equipos y `organizador_id` en torneos).
- Creación de la función `inscribirEquipo` con verificación preventiva de aforo antes del insert.
- Redacción de los casos de prueba de integración de recursos secundarios.

### Prompt importante
> "Implementa los servicios para los recursos secundarios: equipoService e inscripcionService. La inscripción a un torneo debe validar que el solicitante sea capitán, que el torneo esté abierto y que no supere plazas_max. Incluye pruebas completas."

### Resultado
La IA generó los dos servicios de forma modular y con comprobaciones explícitas de negocio.

### Decisión del estudiante
Se optó por incluir un barrel export (`src/services/index.js`) para que el futuro frontend de la Práctica 2 pueda importar todos los servicios desde un único módulo (`import { torneoService, authService } from './services'`).

### Correcciones manuales
Se ajustó la comprobación de cancelación para admitir explícitamente tanto al capitán del equipo como al organizador del torneo.

---

## COMMITS RELACIONADOS
- `f162032` - feat(inscripciones): Iteracion 04 - Servicios de equipos e inscripciones con control de aforo y capitania
