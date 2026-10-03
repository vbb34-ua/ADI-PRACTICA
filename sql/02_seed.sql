-- ==============================================================================
-- ADI - PRÁCTICA 1: DATOS SEMILLA (SEED DATA)
-- Proyecto: Gestor de Torneos y Ligas de Videojuegos
-- ==============================================================================
-- Instrucciones:
-- 1. Primero ve a "Authentication -> Users" en Supabase y crea al menos un usuario
--    (por ejemplo: organizador@torneos.com con Auto-confirm activo).
-- 2. Pega y ejecuta este bloque completo en el "SQL Editor" de Supabase.
--    El script detectará automáticamente tu usuario y creará torneos y equipos.
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
