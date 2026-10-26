-- =====================================================================
-- SecureGate: tabla de perfiles con Row Level Security
--
-- - No guarda contraseñas ni duplica datos de autenticación: el correo y
--   las credenciales viven solo en auth.users (gestionado por Supabase).
-- - Cada usuario solo puede leer y modificar SU fila (auth.uid() = id).
-- - La fila se crea automáticamente al registrarse (trigger).
-- Es idempotente: puede ejecutarse varias veces.
-- =====================================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Datos de perfil no sensibles. Una fila por usuario de auth.users.';

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Cada usuario lee su perfil" on public.profiles;
create policy "Cada usuario lee su perfil"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Cada usuario actualiza su perfil" on public.profiles;
create policy "Cada usuario actualiza su perfil"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Permisos mínimos: anónimos sin acceso; autenticados solo leen y cambian display_name.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea perfiles para usuarios que ya existieran antes de esta migración.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
