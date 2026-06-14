-- ─────────────────────────────────────────────────────────────
--  user_settings — API key por usuário + flag de desabilitado
--  Rode este SQL uma vez no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  api_key    text,
  provider   text default 'openrouter',  -- 'openai' | 'anthropic' | 'openrouter'
  disabled   boolean default false,
  updated_at timestamptz default now()
);

-- Para tabelas já criadas antes desta coluna existir:
alter table public.user_settings add column if not exists provider text default 'openrouter';

alter table public.user_settings enable row level security;

-- Cada usuário só lê a própria linha (o frontend usa isso para pegar a API key).
-- O painel de admin escreve via service_role (que ignora RLS), então não há
-- policy de insert/update aqui de propósito — usuários comuns não editam.
drop policy if exists "user reads own settings" on public.user_settings;
create policy "user reads own settings" on public.user_settings
  for select using (auth.uid() = user_id);
