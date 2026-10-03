-- ==============================================================================
-- ADI - PRÁCTICA 1: ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Proyecto: Gestor de Torneos y Ligas de Videojuegos
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: PERFILES (Vinculada al usuario en auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    nombre_completo TEXT,
    avatar_url TEXT,
    rol TEXT NOT NULL DEFAULT 'jugador' CHECK (rol IN ('jugador', 'organizador', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TRIGGER PARA CREACIÓN AUTOMÁTICA DE PERFIL TRAS REGISTRO EN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, username, nombre_completo)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABLA: TORNEOS (Recurso Principal)
CREATE TABLE IF NOT EXISTS public.torneos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL CHECK (char_length(titulo) >= 4 AND char_length(titulo) <= 100),
    descripcion TEXT,
    videojuego TEXT NOT NULL,
    formato TEXT NOT NULL DEFAULT 'eliminacion_directa' CHECK (formato IN ('eliminacion_directa', 'doble_eliminacion', 'liga', 'suizo')),
    plazas_max INTEGER NOT NULL CHECK (plazas_max >= 2),
    estado TEXT NOT NULL DEFAULT 'inscripcion_abierta' CHECK (estado IN ('borrador', 'inscripcion_abierta', 'en_curso', 'finalizado', 'cancelado')),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    organizador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: EQUIPOS (Recurso Secundario)
CREATE TABLE IF NOT EXISTS public.equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL CHECK (char_length(nombre) >= 3 AND char_length(nombre) <= 50),
    tag TEXT UNIQUE NOT NULL CHECK (char_length(tag) >= 2 AND char_length(tag) <= 6),
    logo_url TEXT,
    capitan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: INSCRIPCIONES (Recurso Secundario / Tabla Intermedia M:N)
CREATE TABLE IF NOT EXISTS public.inscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    torneo_id UUID NOT NULL REFERENCES public.torneos(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'en_espera', 'cancelada')),
    fecha_inscripcion TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_torneo_equipo UNIQUE (torneo_id, equipo_id)
);

-- 7. TABLA: PARTIDAS (Gestión de Enfrentamientos y Resultados)
CREATE TABLE IF NOT EXISTS public.partidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    torneo_id UUID NOT NULL REFERENCES public.torneos(id) ON DELETE CASCADE,
    equipo_local_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    equipo_visitante_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    ronda INTEGER NOT NULL DEFAULT 1,
    resultado_local INTEGER NOT NULL DEFAULT 0 CHECK (resultado_local >= 0),
    resultado_visitante INTEGER NOT NULL DEFAULT 0 CHECK (resultado_visitante >= 0),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_juego', 'finalizada')),
    ganador_id UUID REFERENCES public.equipos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. FUNCIÓN AUXILIAR: VALIDAR CUPO DE INSCRIPCIÓN ANTES DE INSERTAR
CREATE OR REPLACE FUNCTION public.check_torneo_cupo()
RETURNS TRIGGER AS $$
DECLARE
    v_plazas_max INTEGER;
    v_actuales INTEGER;
    v_estado TEXT;
BEGIN
    SELECT plazas_max, estado INTO v_plazas_max, v_estado 
    FROM public.torneos 
    WHERE id = NEW.torneo_id;

    IF v_estado <> 'inscripcion_abierta' THEN
        RAISE EXCEPTION 'El torneo no acepta inscripciones en su estado actual: %', v_estado;
    END IF;

    SELECT count(*) INTO v_actuales 
    FROM public.inscripciones 
    WHERE torneo_id = NEW.torneo_id AND estado = 'confirmada';

    IF v_actuales >= v_plazas_max THEN
        RAISE EXCEPTION 'El torneo ha completado su aforo máximo de plazas (%)', v_plazas_max;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_torneo_cupo ON public.inscripciones;
CREATE TRIGGER tr_check_torneo_cupo
    BEFORE INSERT ON public.inscripciones
    FOR EACH ROW EXECUTE FUNCTION public.check_torneo_cupo();

-- 9. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS DE ACCESO (POLICIES)

-- --- PERFILES ---
DROP POLICY IF EXISTS "Perfiles lectura publica" ON public.perfiles;
CREATE POLICY "Perfiles lectura publica" 
    ON public.perfiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON public.perfiles;
CREATE POLICY "Usuarios editan su propio perfil" 
    ON public.perfiles FOR UPDATE 
    USING (auth.uid() = id);

-- --- TORNEOS ---
DROP POLICY IF EXISTS "Torneos lectura publica" ON public.torneos;
CREATE POLICY "Torneos lectura publica" 
    ON public.torneos FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados crean torneos" ON public.torneos;
CREATE POLICY "Usuarios autenticados crean torneos" 
    ON public.torneos FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = organizador_id);

DROP POLICY IF EXISTS "Organizador modifica su torneo" ON public.torneos;
CREATE POLICY "Organizador modifica su torneo" 
    ON public.torneos FOR UPDATE 
    USING (auth.uid() = organizador_id);

DROP POLICY IF EXISTS "Organizador elimina su torneo" ON public.torneos;
CREATE POLICY "Organizador elimina su torneo" 
    ON public.torneos FOR DELETE 
    USING (auth.uid() = organizador_id);

-- --- EQUIPOS ---
DROP POLICY IF EXISTS "Equipos lectura publica" ON public.equipos;
CREATE POLICY "Equipos lectura publica" 
    ON public.equipos FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados crean equipos" ON public.equipos;
CREATE POLICY "Usuarios autenticados crean equipos" 
    ON public.equipos FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = capitan_id);

DROP POLICY IF EXISTS "Capitan modifica su equipo" ON public.equipos;
CREATE POLICY "Capitan modifica su equipo" 
    ON public.equipos FOR UPDATE 
    USING (auth.uid() = capitan_id);

DROP POLICY IF EXISTS "Capitan elimina su equipo" ON public.equipos;
CREATE POLICY "Capitan elimina su equipo" 
    ON public.equipos FOR DELETE 
    USING (auth.uid() = capitan_id);

-- --- INSCRIPCIONES ---
DROP POLICY IF EXISTS "Inscripciones lectura publica" ON public.inscripciones;
CREATE POLICY "Inscripciones lectura publica" 
    ON public.inscripciones FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Capitan inscribe su equipo" ON public.inscripciones;
CREATE POLICY "Capitan inscribe su equipo" 
    ON public.inscripciones FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.equipos 
            WHERE equipos.id = inscripciones.equipo_id 
              AND equipos.capitan_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Capitan o organizador cancela inscripcion" ON public.inscripciones;
CREATE POLICY "Capitan o organizador cancela inscripcion" 
    ON public.inscripciones FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.equipos 
                WHERE equipos.id = inscripciones.equipo_id 
                  AND equipos.capitan_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.torneos 
                WHERE torneos.id = inscripciones.torneo_id 
                  AND torneos.organizador_id = auth.uid()
            )
        )
    );

-- --- PARTIDAS ---
DROP POLICY IF EXISTS "Partidas lectura publica" ON public.partidas;
CREATE POLICY "Partidas lectura publica" 
    ON public.partidas FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Organizador gestiona partidas" ON public.partidas;
CREATE POLICY "Organizador gestiona partidas" 
    ON public.partidas FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.torneos 
            WHERE torneos.id = partidas.torneo_id 
              AND torneos.organizador_id = auth.uid()
        )
    );
