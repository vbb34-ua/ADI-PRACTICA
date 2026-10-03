# PROJECT_SPEC - Gestor de Torneos y Ligas de Videojuegos

## 1. Descripción del Proyecto
Se desarrolla una plataforma web orientada a la organización, inscripción y seguimiento de torneos y ligas comunitarias de videojuegos y esports (inspirada en plataformas como FACEIT, Battlefy o Challonge). 

El sistema centraliza la gestión de competiciones de deportes electrónicos (como Counter-Strike 2, Valorant, Rocket League o League of Legends), permitiendo a organizadores planificar eventos competitivos y a los jugadores formar escuadras e inscribirse en torneos abiertos.

## 2. Problema que Resuelve
En las comunidades amateur y semiprofesionales de videojuegos, la gestión de torneos suele realizarse de forma caótica mediante servidores de Discord, formularios dispersos y hojas de cálculo manuales. Esto provoca desorganización en las inscripciones, disputas en la asignación de plazas y falta de transparencia en los resultados. 

La plataforma resuelve este problema ofreciendo un backend estructurado, seguro y con reglas de negocio claras para inscripciones, control de cupos y seguimiento de resultados.

## 3. Tipos de Usuarios
- **Visitante (no autenticado):** Puede explorar el catálogo de torneos públicos, buscar por videojuego o estado, ver el detalle de un torneo, sus normas, equipos inscritos, calendario de partidas y tablas de clasificación.
- **Usuario Autenticado / Jugador:** Puede registrarse e iniciar sesión, gestionar su perfil personal, crear y administrar su equipo/escuadra (asumiendo el rol de capitán) e inscribir a su equipo en torneos que dispongan de plazas.
- **Organizador / Creador de Torneo:** Usuario autenticado que crea un torneo. Tiene privilegios exclusivos para modificar sus datos, cerrar inscripciones, generar emparejamientos y registrar/validar los marcadores de las partidas de sus propios torneos.
- **Administrador:** Rol con permisos globales de moderación sobre torneos y usuarios.

## 4. Recurso Principal
- **Torneos (`torneos`):** Representa cada competición creada en la plataforma. Posee título, descripción, videojuego, formato (eliminación directa, liga, etc.), número máximo de plazas, fechas y estado (`borrador`, `inscripcion_abierta`, `en_curso`, `finalizado`, `cancelado`).

## 5. Recursos Secundarios
- **Equipos (`equipos`):** Agrupación competitiva creada por un usuario (capitán), con nombre, siglas/tag y logo.
- **Inscripciones (`inscripciones`):** Registro que vincula formalmente un equipo a un torneo determinado. Controla el límite de plazas y el estado de la solicitud (`confirmada`, `en_espera`, `cancelada`).
- **Partidas (`partidas`):** Enfrentamientos programados entre dos equipos dentro de un torneo, con registro de rondas/mapas ganados y estado del enfrentamiento.
- **Perfiles (`perfiles`):** Información complementaria ligada a la cuenta de usuario (nombre de usuario, biografía, avatar, rol).

## 6. Relaciones entre Recursos
- Un **Usuario** puede crear y organizar muchos **Torneos** (1 a N).
- Un **Usuario** capitanea y gestiona un **Equipo** (1 a 1 o 1 a N).
- Un **Torneo** tiene muchas **Inscripciones** de **Equipos** (relación N a M mediada por la entidad `inscripciones`).
- Un **Torneo** agrupa muchas **Partidas** (1 a N).
- Una **Partida** enfrenta a dos **Equipos** (equipo local y equipo visitante) que deben estar previamente inscritos en el torneo.

## 7. Funcionalidades Principales (Ámbito Backend - Práctica 1)
- **Autenticación y Perfiles:**
  - Registro de usuarios con correo y contraseña.
  - Inicio de sesión con expedición de tokens JWT y cierre de sesión.
  - Consulta y edición del perfil personal (garantizando que cada usuario solo modifica su propio perfil).
- **Operaciones sobre Torneos (Recurso Principal):**
  - Creación de torneos con validación exhaustiva de parámetros (plazas > 1, fechas coherentes, campos requeridos).
  - Búsqueda y filtrado de torneos por videojuego y estado.
  - Listado paginado de torneos (`page`, `pageSize` / `limit`, `offset`).
  - Obtención de detalle completo de un torneo junto con sus recursos secundarios asociados (equipos inscritos / partidas).
  - Actualización de datos del torneo (restringida exclusivamente al usuario organizador).
  - Eliminación de un torneo (restringida al organizador o administrador).
- **Operaciones sobre Recursos Secundarios (Equipos e Inscripciones):**
  - Creación de equipos por usuarios autenticados.
  - Inscripción de un equipo a un torneo, validando que el solicitante sea el capitán, que el torneo esté en fase abierta y que no se supere el cupo máximo.
  - Listado de equipos inscritos en un torneo específico.
  - Cancelación/baja de una inscripción por parte del capitán.
- **Capa de Servicios Desacoplada:**
  - Todas las operaciones expuestas mediante funciones modulares de JavaScript sin acoplar al cliente a la sintaxis directa de la base de datos o Supabase SDK.
- **Pruebas Automatizadas:**
  - Suite de tests automatizados que comprueban cada caso de uso y regla de validación.

## 8. Fuera de Alcance (Práctica 1)
- Interfaz gráfica web (HTML, CSS, vistas de navegador) para el usuario final (planificada para la Práctica 2).
- Pasarela de pago o gestión de premios económicos reales.
- Algoritmo automatizado de generación de "loser bracket" complejo multinivel (se soporta el modelo de partidas básico).
- Integración con APIs oficiales de videojuegos (Riot Games, Steam Web API) para captura automática en tiempo real de marcadores.
