-- ===========================================================================
-- MELANTIA — ECOSISTEMA PROFESIONAL (EP-3)
-- ===========================================================================
-- ESTADO: §1–§7 EJECUTADOS en melantia_db (2026-09-29, commit EP-3 —
-- 13 tablas, docs/EP_DDL_REVISION.md §4).
-- §8 (ep_proyecto_concesiones, EP-4E): DISEÑO APROBADO 2026-10-01 —
-- **pendiente de ejecución** vía migraciones/m3_ep4e_autorizacion.sql.
-- Diseño: docs/ECOSISTEMA_PROFESIONAL.md + docs/EP_MODELO_DATOS.md
-- Integración verificada: docs/EP_INTEGRACION.md
--
-- Decisiones aplicadas:
--   D1-c: enlaces por tipo con FK real (nada polimórfico en ep_proyecto_*)
--   D5:   sin ubicación propia del EP
--   D8:   prefijo ep_ solo en familia proyecto (proyectos* reservado a M6)
--   D9:   contexto extensible — se refleja en actividades.contexto_*
--         y audit_eventos.contexto_* (sin FK física, deliberado: el
--         contexto de una actividad/evento de auditoría es opcional y
--         puede apuntar a tipos heterogéneos que aún no existen)
--
-- Convenciones: UUID uuid_generate_v4(), TIMESTAMPTZ, CHECK de estado,
-- índices idx_*, ON DELETE CASCADE (padre→hijo) / SET NULL (opcional).
-- Dependencias existentes: usuarios, fincas, lotes, levantamientos,
-- registros_campo (todas UUID PK).
--
-- DIFERIDAS a rediseño M11 (B2) — NO incluidas en este archivo:
--   ep_proyecto_evidencias, ep_proyecto_informes
--   (evidencias_documentos hoy exige campos comerciales NOT NULL).
-- ===========================================================================


-- ===========================================================================
-- 1. CATÁLOGO DE PROFESIONES (transversal — sirve fuera del EP)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS perfiles_profesionales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,      -- 'agronomo','veterinario',…
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ===========================================================================
-- 2. USUARIO ↔ PERFIL PROFESIONAL (multi-perfil)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS usuarios_perfiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL
        REFERENCES perfiles_profesionales(id) ON DELETE CASCADE,
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_perfiles_unico UNIQUE (usuario_id, perfil_id)
);


-- ===========================================================================
-- 3. WORKSPACES (la oficina — permanente)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    propietario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    descripcion TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'archivado')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_miembros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL
        REFERENCES workspaces(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    rol VARCHAR(40) NOT NULL DEFAULT 'colaborador'
        CHECK (rol IN ('propietario', 'socio', 'colaborador')),
    estado VARCHAR(30) NOT NULL DEFAULT 'invitado'
        CHECK (estado IN ('invitado', 'activo', 'removido')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workspace_miembros_unico UNIQUE (workspace_id, usuario_id)
);


-- ===========================================================================
-- 4. PROYECTOS (unidad de trabajo del EP)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS ep_proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID
        REFERENCES workspaces(id) ON DELETE SET NULL,   -- NULL = personal
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN (
            'borrador', 'activo', 'en_pausa', 'cerrado', 'archivado')),
    creado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,     -- conserva historia
    fecha_inicio DATE,
    fecha_objetivo DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ep_proyecto_participantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL
        REFERENCES ep_proyectos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,
    rol VARCHAR(40) NOT NULL
        CHECK (rol IN (
            'propietario', 'cliente', 'profesional_responsable',
            'colaborador', 'tecnico', 'auditor')),
    estado VARCHAR(30) NOT NULL DEFAULT 'invitado'
        CHECK (estado IN ('invitado', 'activo', 'removido')),
    asignado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ep_proyecto_participantes_unico
        UNIQUE (proyecto_id, usuario_id)   -- un usuario, un rol por proyecto
);


-- ===========================================================================
-- 5. VÍNCULOS PROYECTO ↔ RECURSOS EXISTENTES (D1-c: por tipo, FK real)
--    Borrar el recurso corta el vínculo (CASCADE). Borrar el proyecto
--    corta sus vínculos (CASCADE). El recurso nunca se toca.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS ep_proyecto_fincas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL
        REFERENCES ep_proyectos(id) ON DELETE CASCADE,
    finca_id UUID NOT NULL
        REFERENCES fincas(id) ON DELETE CASCADE,
    vinculado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    nota VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ep_proyecto_fincas_unico UNIQUE (proyecto_id, finca_id)
);

CREATE TABLE IF NOT EXISTS ep_proyecto_lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL
        REFERENCES ep_proyectos(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL
        REFERENCES lotes(id) ON DELETE CASCADE,
    vinculado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    nota VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ep_proyecto_lotes_unico UNIQUE (proyecto_id, lote_id)
);

CREATE TABLE IF NOT EXISTS ep_proyecto_levantamientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL
        REFERENCES ep_proyectos(id) ON DELETE CASCADE,
    levantamiento_id UUID NOT NULL
        REFERENCES levantamientos(id) ON DELETE CASCADE,
    vinculado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    nota VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ep_proyecto_levantamientos_unico
        UNIQUE (proyecto_id, levantamiento_id)
);

CREATE TABLE IF NOT EXISTS ep_proyecto_registros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL
        REFERENCES ep_proyectos(id) ON DELETE CASCADE,
    registro_id UUID NOT NULL
        REFERENCES registros_campo(id) ON DELETE CASCADE,
    vinculado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    nota VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ep_proyecto_registros_unico UNIQUE (proyecto_id, registro_id)
);

-- DIFERIDAS (B2 — rediseño M11): ep_proyecto_evidencias → evidencias_documentos,
-- ep_proyecto_informes → evidencias_documentos (rol entregable).
-- No crear hasta que M11 sea custodia genérica.


-- ===========================================================================
-- 6. ACTIVIDADES + AGENDA (transversales — Master FULL §37)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50),                        -- 'visita','muestreo','entrega',
                                            --  'audiencia','inspeccion',…
    descripcion TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN (
            'pendiente', 'en_curso', 'completada', 'cancelada')),
    responsable_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    -- Contexto opcional y suave (sin FK física — deliberado: el contexto
    -- puede ser proyecto/finca/otro tipo heterogéneo aún inexistente;
    -- el service valida su existencia. Ver EP_MODELO_DATOS §11, D9).
    contexto_tipo VARCHAR(50),               -- 'proyecto','finca','general'
    contexto_id UUID,
    fecha_objetivo DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agenda_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID
        REFERENCES actividades(id) ON DELETE CASCADE,   -- NULL = evento suelto
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,      -- dueño de la agenda
    fecha_inicio TIMESTAMPTZ NOT NULL,
    duracion_min INT CHECK (duracion_min IS NULL OR duracion_min > 0),
    ubicacion_texto VARCHAR(255),
    latitud DOUBLE PRECISION,               -- DOUBLE PRECISION, nunca REAL
    longitud DOUBLE PRECISION,
    recordatorio_min INT,
    estado VARCHAR(30) NOT NULL DEFAULT 'programado'
        CHECK (estado IN ('programado', 'cumplido', 'cancelado')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ===========================================================================
-- 7. AUDITORÍA TRANSVERSAL (shared/audit — sirve a EP y Administración)
--    Solo INSERT: sin updated_at, sin UPDATE/DELETE previstos.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS audit_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,  -- NULL = sistema
    actor_tipo VARCHAR(30) NOT NULL DEFAULT 'usuario'
        CHECK (actor_tipo IN ('usuario', 'sistema')),
    accion VARCHAR(100) NOT NULL,            -- 'proyecto.creado',
                                            --  'recurso.vinculado',
                                            --  'admin.cuota_ajustada',…
    objeto_tipo VARCHAR(50),
    objeto_id UUID,
    contexto_tipo VARCHAR(50),               -- 'proyecto','workspace',…
    contexto_id UUID,                        -- suave, sin FK (igual que
                                            --  actividades.contexto_*)
    detalle JSONB,                           -- valor anterior/nuevo
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ===========================================================================
-- 8. CONCESIONES CONTEXTUALES (EP-4E — diseño aprobado 2026-10-01)
--    Grants por participante sobre tipo/instancia de recurso del
--    proyecto. Registro histórico: las revocadas NO se borran.
--    Unicidad solo sobre 'activa' (índices parciales) — permite
--    re-otorgar tras revocar y resuelve el caso recurso_id IS NULL.
--    EP_MODELO_DATOS §14.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS ep_proyecto_concesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL
        REFERENCES ep_proyectos(id) ON DELETE CASCADE,
    participante_id UUID NOT NULL
        REFERENCES ep_proyecto_participantes(id) ON DELETE CASCADE,
    -- Qué se concede: tipo siempre; instancia opcional (NULL = todos
    -- los recursos de ese tipo dentro del proyecto).
    recurso_tipo VARCHAR(40) NOT NULL
        CHECK (recurso_tipo IN (
            'finca', 'lote', 'levantamiento', 'registro',
            'actividad', 'documento', 'presupuesto', 'resultado'
        )),
    recurso_id UUID,                    -- referencia suave, sin FK —
                                        -- deliberado (precedente D9:
                                        -- actividades.contexto_id y
                                        -- audit_eventos.contexto_id)
    nivel VARCHAR(20) NOT NULL
        CHECK (nivel IN ('consulta', 'crear', 'editar')),
                                        -- 'administrar' nunca se
                                        -- concede por grant (techo E2)
    otorgado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    vigente_hasta TIMESTAMPTZ,          -- NULL = indefinido
    estado VARCHAR(30) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'revocada')),
    revocado_por UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,
    revocado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ===========================================================================
-- ÍNDICES
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_perfiles_usuario
    ON usuarios_perfiles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfiles_perfil
    ON usuarios_perfiles(perfil_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_propietario
    ON workspaces(propietario_id);
CREATE INDEX IF NOT EXISTS idx_workspace_miembros_ws
    ON workspace_miembros(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_miembros_usuario
    ON workspace_miembros(usuario_id);

CREATE INDEX IF NOT EXISTS idx_ep_proyectos_workspace
    ON ep_proyectos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ep_proyectos_estado
    ON ep_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_ep_proyectos_creado
    ON ep_proyectos(creado_por);
CREATE INDEX IF NOT EXISTS idx_ep_participantes_proyecto
    ON ep_proyecto_participantes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ep_participantes_usuario
    ON ep_proyecto_participantes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_ep_fin_proyecto
    ON ep_proyecto_fincas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ep_fin_finca
    ON ep_proyecto_fincas(finca_id);
CREATE INDEX IF NOT EXISTS idx_ep_lot_proyecto
    ON ep_proyecto_lotes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ep_lot_lote
    ON ep_proyecto_lotes(lote_id);
CREATE INDEX IF NOT EXISTS idx_ep_lev_proyecto
    ON ep_proyecto_levantamientos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ep_lev_levantamiento
    ON ep_proyecto_levantamientos(levantamiento_id);
CREATE INDEX IF NOT EXISTS idx_ep_reg_proyecto
    ON ep_proyecto_registros(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ep_reg_registro
    ON ep_proyecto_registros(registro_id);

CREATE INDEX IF NOT EXISTS idx_actividades_responsable
    ON actividades(responsable_id);
CREATE INDEX IF NOT EXISTS idx_actividades_contexto
    ON actividades(contexto_tipo, contexto_id);
CREATE INDEX IF NOT EXISTS idx_actividades_estado
    ON actividades(estado);

CREATE INDEX IF NOT EXISTS idx_agenda_usuario
    ON agenda_eventos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agenda_actividad
    ON agenda_eventos(actividad_id);
CREATE INDEX IF NOT EXISTS idx_agenda_fecha
    ON agenda_eventos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_audit_actor
    ON audit_eventos(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_objeto
    ON audit_eventos(objeto_tipo, objeto_id);
CREATE INDEX IF NOT EXISTS idx_audit_contexto
    ON audit_eventos(contexto_tipo, contexto_id);
CREATE INDEX IF NOT EXISTS idx_audit_accion
    ON audit_eventos(accion);
CREATE INDEX IF NOT EXISTS idx_audit_fecha
    ON audit_eventos(created_at);

-- EP-4E — unicidad de concesiones SOLO sobre activas
CREATE UNIQUE INDEX IF NOT EXISTS uq_ep_concesiones_activa_instancia
    ON ep_proyecto_concesiones (participante_id, recurso_tipo, recurso_id)
    WHERE estado = 'activa' AND recurso_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ep_concesiones_activa_tipo
    ON ep_proyecto_concesiones (participante_id, recurso_tipo)
    WHERE estado = 'activa' AND recurso_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_ep_concesiones_proyecto
    ON ep_proyecto_concesiones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ep_concesiones_participante
    ON ep_proyecto_concesiones(participante_id);
CREATE INDEX IF NOT EXISTS idx_ep_concesiones_recurso
    ON ep_proyecto_concesiones(recurso_tipo, recurso_id);


-- ===========================================================================
-- SEED OPCIONAL — catálogo inicial de perfiles (Master FULL §36.4)
-- Pendiente de decisión: incluir en la migración o como seed aparte (B6).
-- ===========================================================================
-- INSERT INTO perfiles_profesionales (codigo, nombre) VALUES
--   ('productor','Productor'),
--   ('agronomo','Agrónomo / Agropecuario'),
--   ('veterinario','Médico Veterinario'),
--   ('forestal','Ingeniero Forestal'),
--   ('ambiental','Profesional Ambiental'),
--   ('civil','Ingeniero Civil'),
--   ('arquitecto','Arquitecto'),
--   ('abogado','Abogado'),
--   ('transportista','Transportista'),
--   ('emprendedor','Emprendedor')
-- ON CONFLICT (codigo) DO NOTHING;
