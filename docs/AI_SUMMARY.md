# AI_SUMMARY - Resumen Global del Uso de IA en el Proyecto

## 1. Herramientas y Modelos Utilizados
- **Entorno de Desarrollo:** Antigravity IDE (Agente Inteligente de Pair Programming)
- **Modelo Principal:** Gemini 3.8 Flash (High)
- **Modo de Interacción:** Asistente contextual con acceso directo a workspace, terminal y ejecución de pruebas.

## 2. Uso Principal de la IA
- **Planificación y Metodología SDD:** Asistencia en la estructuración de las especificaciones (`PROJECT_SPEC.md`, `ARCHITECTURE.md`) y en la definición de las 5 iteraciones de desarrollo con sus secciones `SPEC`, `PLAN`, `TEST_PLAN`, `AI_LOG` y `COMMITS RELACIONADOS`.
- **Diseño del Esquema Relacional de Base de Datos:** Generación del script SQL (`sql/01_schema.sql`) para Supabase (PostgreSQL), incluyendo claves foráneas, restricciones `CHECK`, triggers de creación de perfiles y funciones de control de aforo.
- **Políticas de Seguridad Row Level Security (RLS):** Redacción de las políticas de acceso granular para que cada usuario solo modifique sus torneos, equipos y perfiles en la base de datos.
- **Implementación de la Capa de Servicios:** Escritura de los módulos JavaScript (`authService`, `torneoService`, `equipoService`, `inscripcionService`) aislando al cliente del SDK directo de Supabase.
- **Diseño y Ejecución de Pruebas Automatizadas:** Creación de una suite de 34 tests en Vitest (`tests/`) y un simulador en memoria (`mockSupabase.js`) para garantizar ejecución offline inmediata y reproducible.

## 3. Partes Modificadas y Revisadas Manualmente
- **Compatibilidad de Node.js v20:** Se identificó que `@supabase/supabase-js` v2.49 requería WebSocket nativo en entornos recientes. Se introdujo manualmente un polyfill ligero en `src/lib/supabaseClient.js` para asegurar funcionamiento impecable en el entorno de desarrollo y en la corrección docente.
- **Encadenamiento síncrono del cliente Supabase:** El mock inicial de Supabase no soportaba la sintaxis fluida `.insert().select().single()` ni `.update().eq()`. Se reescribió el generador del mock para reflejar con exactitud la API de PostgREST.
- **Restricciones de Negocio:** Se ajustaron manualmente las reglas de longitud del tag de equipo (entre 2 y 6 caracteres en mayúsculas) y los rangos de títulos de torneos (entre 4 y 100 caracteres).
- **Mapeo para el Examen Teórico/Práctico:** Se verificó y documentó con exactitud qué componente genera el JWT (Supabase GoTrue), cómo se transfiere (JSON payload `access_token`) y cómo se valida mediante RLS con `auth.uid()`.

## 4. Problemas Encontrados con la IA y Soluciones
1. **Problema con WebSockets en Node 20:**
   - *Causa:* La última versión del SDK de Supabase presupone Node 22 con WebSockets globales.
   - *Solución:* Se incorporó un fallback condicional en `supabaseClient.js` para que el cliente arranque sin dependencias adicionales en Node 20.
2. **Métodos asíncronos vs. Builders encadenables en Mocks:**
   - *Causa:* La IA inicialmente modeló `insert` y `update` como funciones `async` directas, lo que provocaba errores de tipo `insert(...).select is not a function`.
   - *Solución:* Se reformuló el mock para devolver un objeto builder con método `then` (thenable), permitiendo el encadenamiento síncrono que utiliza Supabase.
3. **Joins en consultas complejas:**
   - *Causa:* La consulta de recursos secundarios combinados (`torneo` + `inscripciones` + `equipos`) requería resolución anidada.
   - *Solución:* Se configuró la capa de servicios para realizar joins relacionales mediante sintaxis PostgREST y se proveyó fallback en caso de requerir consultas secuenciales.

## 5. Valoración Personal del Estudiante
La utilización de IA ha sido extremadamente eficaz para acelerar la creación de código repetitivo (boileplate de servicios, esquemas SQL y pruebas exhaustivas). No obstante, el seguimiento estricto de la metodología SDD fue crucial para mantener el control sobre la arquitectura del proyecto: haber redactado la `SPEC` antes de generar código impidió que la IA añadiera componentes innecesarios (como endpoints REST innecesarios para BaaS o vistas frontend prematuras expresamente prohibidas en el enunciado).
