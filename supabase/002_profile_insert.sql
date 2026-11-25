-- Ejecutar si ya corriste schema.sql antes: permite crear/editar el propio perfil (upsert).
create policy "profiles: el usuario crea su perfil"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
