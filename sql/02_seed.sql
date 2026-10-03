-- ==============================================================================
-- ADI - PRÁCTICA 1: DATOS SEMILLA (SEED DATA)
-- Proyecto: Gestor de Torneos y Ligas de Videojuegos
-- Nota: Para que las claves foráneas a auth.users funcionen en un entorno real,
-- se debe registrar previamente un usuario organizador en Supabase Auth.
-- Este script incluye datos listos para pruebas con IDs de ejemplo.
-- ==============================================================================

-- Ejemplo de inserción de torneo (suponiendo un organizador existente)
-- Reemplazar el UUID con el ID de un usuario real tras crearlo en Supabase Auth:

/*
-- Ejemplo de inserción manual para pruebas en Supabase SQL Editor:
INSERT INTO public.torneos (
    titulo, 
    descripcion, 
    videojuego, 
    formato, 
    plazas_max, 
    estado, 
    fecha_inicio, 
    organizador_id
) VALUES 
(
    'Copa de Otoño CS2 - Alicante',
    'Torneo clasificatorio de Counter-Strike 2 al mejor de 3 mapas.',
    'CS2',
    'eliminacion_directa',
    8,
    'inscripcion_abierta',
    now() + interval '7 days',
    auth.uid() -- O el UUID de tu usuario en Supabase Auth
),
(
    'Valorant Community Clash',
    'Torneo relámpago 5v5 sin límite de rango.',
    'Valorant',
    'eliminacion_directa',
    16,
    'inscripcion_abierta',
    now() + interval '10 days',
    auth.uid()
),
(
    'Liga Universitaria Rocket League',
    'Competición 3v3 en formato liga.',
    'Rocket League',
    'liga',
    10,
    'en_curso',
    now() - interval '2 days',
    auth.uid()
);
*/
