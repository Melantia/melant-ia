-- MELANTIA IA
-- Script de inicialización para Supabase Storage + metadata de trazabilidad.
-- Archivo pensado para el adaptador de:
--   src/modules/asistente_tecnico_veterinario/gestor_evidencia_fotos.js

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Bucket de Storage para evidencias livianas de trazabilidad
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'melantia-trazabilidad',
  'melantia-trazabilidad',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 2. Tabla de metadata para la nube
-- ---------------------------------------------------------------------

create table if not exists public.evidencia_fotos_nube (
  id uuid primary key default gen_random_uuid(),
  id_local bigint,
  id_animal text not null,
  etapa text not null check (etapa in ('perfil', 'inicio', 'crecimiento', 'final')),
  fecha_toma date,
  peso_estimado numeric(10,2),
  id_lote text,
  latitud double precision,
  longitud double precision,
  precision_gps_m double precision,
  url_nube text not null unique,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_evidencia_nube_animal
  on public.evidencia_fotos_nube (id_animal, fecha_toma desc);

create index if not exists idx_evidencia_nube_lote
  on public.evidencia_fotos_nube (id_lote);

create index if not exists idx_evidencia_nube_etapa
  on public.evidencia_fotos_nube (etapa);

create unique index if not exists uq_evidencia_nube_local
  on public.evidencia_fotos_nube (id_local)
  where id_local is not null;

create or replace function public.set_updated_at_melantia()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_evidencia_fotos_nube_updated_at on public.evidencia_fotos_nube;

create trigger trg_evidencia_fotos_nube_updated_at
before update on public.evidencia_fotos_nube
for each row
execute function public.set_updated_at_melantia();

-- ---------------------------------------------------------------------
-- 3. RLS de la tabla de metadata
-- ---------------------------------------------------------------------
-- Nota: estas políticas permiten operar con la anon key para la app actual.
-- Para un entorno multiusuario con auth real, endurecer por usuario/finca.

alter table public.evidencia_fotos_nube enable row level security;

drop policy if exists "melantia metadata select" on public.evidencia_fotos_nube;
create policy "melantia metadata select"
on public.evidencia_fotos_nube
for select
to anon, authenticated
using (true);

drop policy if exists "melantia metadata insert" on public.evidencia_fotos_nube;
create policy "melantia metadata insert"
on public.evidencia_fotos_nube
for insert
to anon, authenticated
with check (true);

drop policy if exists "melantia metadata update" on public.evidencia_fotos_nube;
create policy "melantia metadata update"
on public.evidencia_fotos_nube
for update
to anon, authenticated
using (true)
with check (true);

-- ---------------------------------------------------------------------
-- 4. RLS de Storage para el bucket melantia-trazabilidad
-- ---------------------------------------------------------------------

drop policy if exists "melantia storage read" on storage.objects;
create policy "melantia storage read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'melantia-trazabilidad');

drop policy if exists "melantia storage insert" on storage.objects;
create policy "melantia storage insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'melantia-trazabilidad');

drop policy if exists "melantia storage update" on storage.objects;
create policy "melantia storage update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'melantia-trazabilidad')
with check (bucket_id = 'melantia-trazabilidad');

drop policy if exists "melantia storage delete" on storage.objects;
create policy "melantia storage delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'melantia-trazabilidad');

commit;

-- ---------------------------------------------------------------------
-- Configuración esperada en MELANTIA
-- ---------------------------------------------------------------------
-- window.MELANTIA_SUPABASE_CONFIG = {
--   url: 'https://TU-PROYECTO.supabase.co',
--   anonKey: 'TU_ANON_KEY',
--   bucket: 'melantia-trazabilidad',
--   table: 'evidencia_fotos_nube',
--   schema: 'public',
--   pathPrefix: 'trazabilidad'
-- };