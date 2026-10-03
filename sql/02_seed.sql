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

DO $$
DECLARE
    v_user_id UUID;
    v_torneo_id UUID;
    v_equipo_id UUID;
BEGIN
    -- 1. Obtener automáticamente el primer usuario existente en Supabase Auth
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No se ha encontrado ningún usuario en Auth. Por favor, crea un usuario primero en Authentication -> Users (con Auto-confirm).';
    END IF;

    -- 2. Insertar torneos de ejemplo asociados al usuario organizador
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
        v_user_id
    ),
    (
        'Valorant Community Clash',
        'Torneo relámpago 5v5 sin límite de rango.',
        'Valorant',
        'eliminacion_directa',
        16,
        'inscripcion_abierta',
        now() + interval '10 days',
        v_user_id
    ),
    (
        'Liga Universitaria Rocket League',
        'Competición 3v3 en formato liga.',
        'Rocket League',
        'liga',
        10,
        'en_curso',
        now() - interval '2 days',
        v_user_id
    );

    -- 3. Insertar equipos de prueba
    INSERT INTO public.equipos (nombre, tag, logo_url, capitan_id)
    VALUES 
        ('Alpha Wolves', 'AW', 'https://api.dicebear.com/7.x/identicon/svg?seed=AlphaWolves', v_user_id),
        ('Beta Titans', 'BT', 'https://api.dicebear.com/7.x/identicon/svg?seed=BetaTitans', v_user_id)
    ON CONFLICT (nombre) DO NOTHING;

    RAISE NOTICE '¡Datos semilla insertados correctamente con el usuario organizador: %!', v_user_id;
END $$;
