# Iteración 02 - Autenticación con JWT y Gestión de Perfiles

## SPEC

### Objetivo
Implementar la capa de servicios para la gestión de usuarios: registro de nuevas cuentas, autenticación mediante correo y contraseña con retorno de tokens JWT, cierre de sesión y consulta/edición del perfil personal (garantizando que cada usuario solo pueda editar sus propios datos).

### Requisitos Funcionales y Técnicos
- **Registro:** Función `authService.registro({ email, password, username, nombreCompleto })` que valida el formato de correo, contraseña mínima de 6 caracteres y nombre de usuario no vacío. Llama a `supabase.auth.signUp`.
- **Autenticación (Login):** Función `authService.login({ email, password })` que invoca `supabase.auth.signInWithPassword`. Debe devolver el objeto de sesión y el token de acceso JWT (`access_token`).
- **Control de Sesión:** `authService.cerrarSesion()` y `authService.obtenerUsuarioActual()`.
- **Perfil de Usuario:**
  - `authService.obtenerPerfil(userId)`: consulta pública de datos de usuario.
  - `authService.actualizarPerfil(userId, datos)`: actualización de datos de perfil (`username`, `nombre_completo`, `avatar_url`) con validación de permisos garantizada tanto por el servicio como por la política RLS en PostgreSQL (`auth.uid() = id`).
- Aislamiento completo de Supabase SDK para el código consumidor.

### Fuera de Alcance
- Recuperación de contraseñas por correo electrónico (SMTP externo).
- Inicio de sesión con proveedores OAuth (Google, Discord, etc.).

---

## PLAN
1. Crear el archivo `src/services/authService.js` con las funciones requeridas.
2. Definir validaciones de entrada en JavaScript antes de enviar datos al servidor.
3. Configurar la extracción explícita del token JWT en la respuesta de inicio de sesión (`data.session.access_token`).
4. Desarrollar la suite de pruebas automatizadas `tests/authService.test.js`.
5. Comprobar que los casos válidos e inválidos arrojan las respuestas y errores esperados.

---

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Registro con email inválido (sin @) | Lanza excepción: "El formato del email no es válido." | Cumplido |
| Registro con contraseña < 6 caracteres | Lanza excepción: "La contraseña debe tener al menos 6 caracteres." | Cumplido |
| Registro con username < 3 caracteres | Lanza excepción: "El nombre de usuario debe tener al menos 3 caracteres." | Cumplido |
| Registro válido | Devuelve objeto de usuario y sesión creada | Cumplido |
| Login con credenciales erróneas | Lanza excepción indicando credenciales inválidas | Cumplido |
| Login correcto con retorno de JWT | Devuelve token de acceso JWT string y sesión activa | Cumplido |
| Consulta de perfil existente | Retorna username, nombre_completo y rol del usuario | Cumplido |
| Actualización válida de perfil | Modifica los campos permitidos y actualiza `updated_at` | Cumplido |
| Actualización con username inválido | Rechaza la petición con mensaje de validación | Cumplido |
| Cierre de sesión (logout) | Invalida la sesión activa y devuelve true | Cumplido |

### Tests automáticos
- `tests/authService.test.js`: 10 pruebas unitarias automatizadas cubriendo todas las ramas de validación y respuesta.

---

## AI_LOG

### Herramienta usada
- Herramienta: Antigravity IDE
- Modelo: Gemini 3.8 Flash
- Tipo: Modelo cloud de generación y verificación de código

### Uso realizado
- Generación de la estructura del servicio `authService.js`.
- Configuración de la extracción del token JWT en la propiedad `token` para facilitar su verificación en el test de clase.
- Diseño de las pruebas automatizadas en `tests/authService.test.js`.

### Prompt importante
> "Implementa authService.js con registro, login con JWT, perfil y edición de perfil. Asegúrate de que el token JWT quede explícitamente expuesto y validado para responder a las preguntas del test de clase sobre quién lo genera y dónde se envía."

### Resultado
La IA implementó el servicio aislando la SDK de Supabase e incluyó las validaciones previas de formato de correo y contraseña.

### Decisión del estudiante
Se acordó que en la función `actualizarPerfil`, además de las políticas RLS en base de datos, se filtraran en JavaScript los campos modificables para impedir que un usuario común intente elevarse el rol a 'admin' o alterar la fecha de creación.

### Correcciones manuales
Se corrigió la estructura del mock de Supabase para soportar el encadenamiento síncrono de `.update(...).eq(...).select().single()`.

---

## COMMITS RELACIONADOS
- `1ebb18c` - feat(auth): Iteracion 02 - Implementacion de authService con JWT y gestion de perfiles
