-- Fase 2 · RF-02, RF-05, RF-06 (ejecutar una vez en SQL Editor)

-- ---------- RF-05 · avistamientos ----------
create table public.sightings (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  author_name text not null default '',
  comment     text not null check (char_length(comment) between 3 and 1000),
  photo_url   text,
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  created_at  timestamptz not null default now()
);
create index sightings_report_idx on public.sightings (report_id, created_at);
alter table public.sightings enable row level security;

create policy "sightings: lectura pública"
  on public.sightings for select to anon, authenticated using (true);
create policy "sightings: autenticados insertan los suyos"
  on public.sightings for insert to authenticated with check (auth.uid() = user_id);
create policy "sightings: el autor elimina"
  on public.sightings for delete to authenticated using (auth.uid() = user_id);

-- Fotos de avistamientos: pet-photos/sightings/<uid>/archivo.jpg
create policy "pet-photos: avistamientos suben a sightings/<uid>"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = 'sightings'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ---------- RF-06 · UPDATE / DELETE de reports solo para el autor ----------
-- Ya existen en schema.sql ("reports: el autor edita" / "reports: el autor elimina").
-- Si no las creaste, descomenta:
-- create policy "reports: el autor edita" on public.reports for update to authenticated
--   using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "reports: el autor elimina" on public.reports for delete to authenticated
--   using (auth.uid() = user_id);
