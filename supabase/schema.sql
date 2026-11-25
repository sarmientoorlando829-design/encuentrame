-- ============================================================
-- Encuéntrame App · Esquema Supabase (ejecutar en SQL Editor)
-- ============================================================

-- ---------- RF-03 · profiles ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  phone      text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: el usuario lee su perfil"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles: el usuario crea su perfil"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles: el usuario actualiza su perfil"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Crea el perfil automáticamente al registrarse (datos vienen en options.data de signUp)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RF-04 · reports ----------
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  status        text not null default 'perdida' check (status in ('perdida','encontrada','resuelta')),
  animal_type   text not null check (animal_type in ('Perro','Gato','Otro')),
  name          text,
  breed         text,
  color         text not null,
  size          text check (size in ('Pequeño','Mediano','Grande')),
  city          text not null,
  description   text,
  lost_date     date not null default current_date,
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  photo_url     text,
  contact_name  text not null,
  created_at    timestamptz not null default now()
);
create index reports_status_geo_idx on public.reports (status, lat, lng);
create index reports_lost_date_idx  on public.reports (lost_date desc);
alter table public.reports enable row level security;

create policy "reports: lectura pública"
  on public.reports for select to anon, authenticated using (true);
create policy "reports: solo autenticados insertan los suyos"
  on public.reports for insert to authenticated with check (auth.uid() = user_id);
create policy "reports: el autor edita"
  on public.reports for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports: el autor elimina"
  on public.reports for delete to authenticated using (auth.uid() = user_id);

-- ---------- RNF-07 · teléfono separado (nunca visible a anónimos) ----------
create table public.report_contacts (
  report_id     uuid primary key references public.reports (id) on delete cascade,
  contact_phone text not null
);
alter table public.report_contacts enable row level security;

create policy "contacts: solo autenticados leen"
  on public.report_contacts for select to authenticated using (true);
create policy "contacts: el autor del reporte inserta"
  on public.report_contacts for insert to authenticated
  with check (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));
create policy "contacts: el autor del reporte edita"
  on public.report_contacts for update to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));

-- Anónimo no tiene ningún privilegio sobre la tabla de contactos
revoke all on public.report_contacts from anon;

-- ---------- Storage · bucket público pet-photos ----------
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

create policy "pet-photos: lectura pública"
  on storage.objects for select to anon, authenticated using (bucket_id = 'pet-photos');
create policy "pet-photos: autenticados suben a su carpeta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pet-photos: el dueño borra sus fotos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
