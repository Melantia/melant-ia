-- ============================================================================
-- MELANTIA — FASE 1: CORE + DATABASE
-- Migración inicial — Supabase / PostgreSQL 15+
--
-- Alcance: roles, permisos, RBAC, perfiles de usuario (sync con auth.users)
-- y configuraciones globales del core.
--
-- Ejecutar en el SQL Editor de Supabase o vía `supabase db push`.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. FUNCIÓN REUTILIZABLE: actualización automática de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
    'Trigger genérico: sella updated_at en cada UPDATE. Reutilizable en todas las tablas.';

-- ----------------------------------------------------------------------------
-- 2. TABLAS CORE
-- ----------------------------------------------------------------------------

-- 2.1 roles ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      varchar(50) NOT NULL UNIQUE,
    descripcion text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS
    'Roles del sistema (admin, usuario, tecnico...). Base del RBAC.';

-- 2.2 permisos ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permisos (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo      varchar(100) NOT NULL UNIQUE,  -- ej. 'fincas:crear'
    descripcion text,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.permisos IS
    'Permisos atómicos del sistema en formato dominio:accion.';

-- 2.3 roles_permisos (puente N:M) ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles_permisos (
    rol_id     uuid        NOT NULL
               REFERENCES public.roles(id)    ON DELETE CASCADE,
    permiso_id uuid        NOT NULL
               REFERENCES public.permisos(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (rol_id, permiso_id)
);

COMMENT ON TABLE public.roles_permisos IS
    'Asignación rol↔permiso. CASCADE: borrar rol/permiso limpia sus asignaciones.';

-- 2.4 usuarios_perfiles (sincronizado con auth.users) -------------------------
CREATE TABLE IF NOT EXISTS public.usuarios_perfiles (
    id          uuid         PRIMARY KEY
                 REFERENCES auth.users(id) ON DELETE CASCADE,
    cedula_ruc  varchar(20)  NOT NULL UNIQUE,
    nombres     varchar(150) NOT NULL,
    apellidos   varchar(150),
    telefono    varchar(25),
    rol_id      uuid         NOT NULL
                REFERENCES public.roles(id) ON DELETE RESTRICT,
    estado      varchar(15)  NOT NULL DEFAULT 'activo'
                CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.usuarios_perfiles IS
    'Perfil de negocio del usuario. id = auth.users.id (FK CASCADE). '
    'RESTRICT en rol: no se borra un rol con usuarios asignados.';

-- 2.5 configuraciones_globales (clave-valor del core) -------------------------
CREATE TABLE IF NOT EXISTS public.configuraciones_globales (
    clave       varchar(100) PRIMARY KEY,
    valor       jsonb        NOT NULL,
    descripcion text,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.configuraciones_globales IS
    'Parámetros del core en formato clave→JSONB (versión, flags, límites).';

-- ----------------------------------------------------------------------------
-- 3. ÍNDICES DE BÚSQUEDA FRECUENTE
--    (cedula_ruc ya indexada por su UNIQUE; codigo/clave/nombre idem)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_perfiles_rol_id
    ON public.usuarios_perfiles (rol_id);

CREATE INDEX IF NOT EXISTS idx_perfiles_estado
    ON public.usuarios_perfiles (estado);

-- Búsqueda del lado del permiso en la tabla puente (el lado rol ya es PK).
CREATE INDEX IF NOT EXISTS idx_roles_permisos_permiso
    ON public.roles_permisos (permiso_id);

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS updated_at
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_permisos_updated_at
    BEFORE UPDATE ON public.permisos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_usuarios_perfiles_updated_at
    BEFORE UPDATE ON public.usuarios_perfiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_config_globales_updated_at
    BEFORE UPDATE ON public.configuraciones_globales
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE public.roles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permisos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_perfiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuraciones_globales ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura para cualquier usuario autenticado.
CREATE POLICY roles_lectura_autenticados
    ON public.roles FOR SELECT TO authenticated
    USING (true);

CREATE POLICY permisos_lectura_autenticados
    ON public.permisos FOR SELECT TO authenticated
    USING (true);

CREATE POLICY roles_permisos_lectura_autenticados
    ON public.roles_permisos FOR SELECT TO authenticated
    USING (true);

CREATE POLICY config_globales_lectura_autenticados
    ON public.configuraciones_globales FOR SELECT TO authenticated
    USING (true);

-- Perfiles: cada usuario solo lee SU propio perfil (punto de partida seguro;
-- la administración se hará con service_role desde el backend).
CREATE POLICY perfiles_lectura_propio
    ON public.usuarios_perfiles FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 6. SEED MÍNIMO (idempotente)
-- ----------------------------------------------------------------------------
INSERT INTO public.roles (nombre, descripcion) VALUES
    ('admin',    'Administrador del sistema — acceso total'),
    ('tecnico',  'Técnico agropecuario — gestión asistida de fincas'),
    ('usuario',  'Productor — acceso a módulos propios')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
