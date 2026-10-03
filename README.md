# Práctica 1 ADI: Backend y Capa de Servicios con Supabase
**Asignatura:** Aplicaciones Distribuidas en Internet (ADI)  
**Proyecto:** Gestor de Torneos y Ligas de Videojuegos (eSports)  
**Estudiante:** Victor  
**Metodología:** SDD (Specification-Driven Development)  

---

## 1. Descripción del Proyecto
Este repositorio contiene la implementación del **backend** para una plataforma web de organización, inscripción y seguimiento de torneos de videojuegos comunitarios (inspirada en plataformas como FACEIT o Battlefy).

El backend está desarrollado sobre **Supabase (BaaS)** mediante una **Capa de Servicios desacoplada** en JavaScript/Node.js, persistencia relacional en **PostgreSQL**, seguridad granular basada en **Row Level Security (RLS)** y autenticación mediante **tokens JWT**.

> [!NOTE]
> Siguiendo estrictamente las indicaciones de la Práctica 1: **No se ha implementado código frontend (ni HTML ni CSS)**. Todas las funcionalidades y reglas de negocio se verifican mediante una suite de pruebas automatizadas con Vitest.

---

## 2. Requerimientos de la Práctica 1 Implementados

| Requerimiento del Enunciado | Implementación en el Proyecto | Archivo Principal |
|---|---|---|
| **Base de Datos Persistente** | Tablas `perfiles`, `torneos`, `equipos`, `inscripciones`, `partidas` con constraints y triggers | [`sql/01_schema.sql`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/sql/01_schema.sql) |
| **Seguridad y Permisos (RLS)** | Políticas PostgreSQL que impiden alterar torneos o perfiles ajenos | [`sql/01_schema.sql`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/sql/01_schema.sql) |
| **Autenticación con JWT** | Registro, Login con JWT, logout y gestión de perfiles de usuario | [`src/services/authService.js`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/src/services/authService.js) |
| **Recurso Principal: CRUD** | Crear torneo con validaciones, actualizar y eliminar (solo organizador) | [`src/services/torneoService.js`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/src/services/torneoService.js) |
| **Recurso Principal: Búsqueda y Paginación** | Búsqueda por texto y listado paginado (`page`, `pageSize`, total, totalPages) | [`src/services/torneoService.js`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/src/services/torneoService.js) |
| **Recurso Principal con Secundario** | Consulta de torneo por ID incluyendo inscripciones y partidas relacionadas | [`src/services/torneoService.js`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/src/services/torneoService.js) |
| **Recurso Secundario** | Creación y listado de equipos; inscripción con control de cupo y capitanía; cancelación | [`src/services/inscripcionService.js`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/src/services/inscripcionService.js) |
| **Capa de Servicios Desacoplada** | Ningún componente consumidor necesita conocer el SDK directo de Supabase | [`src/services/index.js`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/src/services/index.js) |
| **Pruebas Automatizadas** | 45 tests unitarios y de integración con Vitest (100% éxito) y cobertura v8 | [`tests/`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/tests) |
| **Documentación SDD** | Especificaciones, planes, tests logs y commits por cada iteración | [`docs/`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/docs) |

---

## 3. Preparación para el Mini-Test en Clase (13 de Octubre)
Para responder a las preguntas habituales del test docente en Moodle:
- **¿En qué iteración se implementa la autenticación con JWT?**  
  En la **Iteración 02** ([`docs/iterations/02-autenticacion-y-perfiles.md`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/docs/iterations/02-autenticacion-y-perfiles.md)).
- **¿Quién genera el token JWT?**  
  El servidor de autenticación de Supabase (**GoTrue / Supabase Auth**) tras validar el email y la contraseña con `auth.signInWithPassword`.
- **¿Dónde y cómo se le envía al cliente?**  
  El servidor lo envía en la respuesta JSON dentro de `data.session.access_token`. El cliente lo almacena y lo envía en las cabeceras HTTP de peticiones sucesivas como `Authorization: Bearer <access_token>`.
- **¿Cómo se asegura que un usuario no edite el perfil o torneo de otro?**  
  Mediante **Row Level Security (RLS)** en PostgreSQL: la directiva `USING (auth.uid() = organizador_id)` o `USING (auth.uid() = id)` comprueba el identificador del usuario extraído directamente del JWT firmado.

---

## 4. Estructura de Documentación SDD

```text
docs/
├── PROJECT_SPEC.md                            # Especificación global de alto nivel
├── ARCHITECTURE.md                            # Arquitectura, modelo ER y decisiones técnicas
├── AI_SUMMARY.md                              # Resumen global y transparente del uso de IA
└── iterations/
    ├── 01-setup-y-modelo-datos.md             # Iteración 1: Estructura y base de datos
    ├── 02-autenticacion-y-perfiles.md         # Iteración 2: Auth, JWT y perfiles
    ├── 03-recurso-principal-torneos.md        # Iteración 3: CRUD y filtros de Torneos
    ├── 04-recursos-secundarios-inscripciones.md # Iteración 4: Equipos e Inscripciones
    └── 05-pruebas-automatizadas-y-validacion.md # Iteración 5: Tests y validación
```

---

## 5. Instrucciones de Ejecución y Pruebas

### 5.1. Requisitos Previos
- Node.js (v20 o superior) y npm.

### 5.2. Instalación de Dependencias
```bash
npm install
```

### 5.3. Ejecutar las Pruebas Automatizadas (Modo Offline / Inmediato)
El proyecto incluye un mock integral que permite ejecutar toda la suite de pruebas sin requerir conexión a internet ni configuración previa de Supabase:

```bash
npm test
```

Salida esperada:
```text
 ✓ tests/servicesIndex.test.js (2 tests)
 ✓ tests/equipoService.test.js (12 tests)
 ✓ tests/authService.test.js (10 tests)
 ✓ tests/inscripcionService.test.js (7 tests)
 ✓ tests/torneoService.test.js (14 tests)

 Test Files  5 passed (5)
 Tests       45 passed (45)
```

Para generar la tabla de cobertura de código (Code Coverage) ejecutada con `@vitest/coverage-v8`:
```bash
npm run test:coverage
```

---

## 6. Despliegue en un Proyecto Real de Supabase (Opcional / Producción)
Si se desea conectar con una instancia activa en la nube de Supabase:
1. Acceder a [https://supabase.com](https://supabase.com) y crear un nuevo proyecto.
2. Abrir el apartado **SQL Editor** en el panel de control de Supabase.
3. Copiar y ejecutar el contenido de [`sql/01_schema.sql`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/sql/01_schema.sql).
4. Opcionalmente, ejecutar [`sql/02_seed.sql`](file:///c:/Users/User/Desktop/uni/ADI/ADI-PRACTICA/sql/02_seed.sql) para cargar datos de prueba.
5. Copiar la URL del proyecto y la `anon key` desde **Project Settings -> API**.
6. Crear o editar el archivo `.env`:
   ```env
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
