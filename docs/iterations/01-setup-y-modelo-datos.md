# Iteración 01 - Setup del Proyecto y Modelo de Datos en Supabase

## SPEC

### Objetivo
Establecer la estructura base del proyecto Node.js con módulos ESM, configurar el cliente de conexión a Supabase y diseñar el modelo relacional de datos en PostgreSQL con restricciones de integridad y políticas de seguridad RLS (Row Level Security).

### Requisitos Funcionales y Técnicos
- Configurar `package.json` con soporte nativo de módulos ECMAScript (`"type": "module"`).
- Definir `.gitignore` para salvaguardar credenciales (`.env`) y excluir dependencias (`node_modules`).
- Crear script SQL (`sql/01_schema.sql`) para Supabase que incluya:
  - Tabla `perfiles` enlazada a `auth.users` mediante clave foránea y trigger automático de creación.
  - Tabla `torneos` con validación de plazas mínimas (`plazas_max >= 2`) y estados válidos.
  - Tabla `equipos` con restricciones de longitud en nombre y tag.
  - Tabla `inscripciones` con clave única compuesta `(torneo_id, equipo_id)` y trigger de aforo.
  - Tabla `partidas` para enfrentamientos y resultados.
  - Habilitación de Row Level Security (RLS) en todas las tablas con políticas de lectura pública y modificación restringida al propietario.
- Implementar `src/lib/supabaseClient.js` con soporte para lectura de variables de entorno y desacoplamiento para testing.

### Fuera de Alcance
- Vistas HTML/CSS o interfaz gráfica de usuario en navegador.
- Servicios específicos de lógica de negocio (se implementarán en iteraciones posteriores).

---

## PLAN
1. Crear el archivo `.gitignore` protegiendo `.env` y excluyendo `node_modules`.
2. Inicializar `package.json` con dependencias `@supabase/supabase-js`, `dotenv` y `vitest`.
3. Elaborar los documentos globales de especificación (`docs/PROJECT_SPEC.md` y `docs/ARCHITECTURE.md`).
4. Diseñar y redactar `sql/01_schema.sql` y `sql/02_seed.sql` con sintaxis compatible con el editor SQL de Supabase.
5. Desarrollar `src/lib/supabaseClient.js` permitiendo inyección de cliente simulado para pruebas locales.

---

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Carga de dependencias y módulos ESM | `npm` instala paquetes y Node ejecuta sin errores de sintaxis | Correcto |
| Inicialización del cliente Supabase | Se instancia `createClient` con variables de entorno o valores por defecto | Correcto |
| Integridad del script SQL | Tablas, claves foráneas, triggers y RLS definidos sin errores de sintaxis PostgreSQL | Correcto |
| Polyfill para WebSocket en Node 20 | `@supabase/supabase-js` no falla al arrancar en Node.js v20 | Correcto |

### Tests automáticos
- Verificación de ejecución del entorno mediante el comando de testeo de Vitest.

---

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity IDE (Pair Programming)
- Modelo: Gemini 3.8 Flash
- Tipo: Modelo cloud avanzado de ingeniería de software

### Uso realizado
- Propuesta de la estructura inicial de carpetas y esquema de base de datos relacional para Supabase.
- Generación de políticas RLS y triggers PL/pgSQL para control de aforo y perfiles automáticos.
- Detección y solución del problema de compatibilidad de WebSockets en Node v20.

### Prompt importante
> "Necesito que me ayudes a hacer lo que me pide en la práctica 1 de ADI con backend en Supabase y metodología SDD. Diseña la base de datos relacional y la arquitectura desacoplada."

### Resultado
La IA propuso el esquema relacional completo con 5 tablas (`perfiles`, `torneos`, `equipos`, `inscripciones`, `partidas`), el trigger `handle_new_user` y el trigger `check_torneo_cupo`.

### Decisión del estudiante
Se aceptó la propuesta de base de datos relacional, pero se insistió en que las restricciones de seguridad estuvieran duplicadas tanto en la base de datos (mediante RLS y constraints) como en la capa de servicios en JS para cumplir los criterios de validación docente.

### Correcciones manuales
Se ajustó el campo `tag` de los equipos para restringir su longitud entre 2 y 6 caracteres y forzar mayúsculas.

---

## COMMITS RELACIONADOS
- `ccedb75` - feat(setup): Iteracion 01 - Configuracion inicial, modelo relacional en Supabase y arquitectura SDD
