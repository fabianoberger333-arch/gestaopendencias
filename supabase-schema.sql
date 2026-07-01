-- ============================================================
-- Grupo 3B — Gestão de Pendências
-- Schema do banco de dados (Postgres / Supabase)
-- Execute este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- ============================================================

create table if not exists tasks (
  id         bigint generated always as identity primary key,
  biz        text not null default 'Outros',
  title      text not null,
  status     text not null default 'pending'
             check (status in ('pending','progress','done','blocked','not-started')),
  priority   text not null default 'medium'
             check (priority in ('high','medium','low')),
  assignee   text not null default 'Não atribuído',
  opened     date not null default current_date,
  due        date,
  notes      text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mantém updated_at sempre atualizado
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_updated_at();

-- ── SEGURANÇA: Row Level Security ──────────────────────────
-- Ninguém acessa a tabela sem estar autenticado no Supabase Auth,
-- mesmo que a URL e a anon key do projeto sejam conhecidas.
alter table tasks enable row level security;

drop policy if exists "tasks_select_authenticated" on tasks;
create policy "tasks_select_authenticated"
  on tasks for select
  to authenticated
  using (true);

drop policy if exists "tasks_insert_authenticated" on tasks;
create policy "tasks_insert_authenticated"
  on tasks for insert
  to authenticated
  with check (true);

drop policy if exists "tasks_update_authenticated" on tasks;
create policy "tasks_update_authenticated"
  on tasks for update
  to authenticated
  using (true) with check (true);

drop policy if exists "tasks_delete_authenticated" on tasks;
create policy "tasks_delete_authenticated"
  on tasks for delete
  to authenticated
  using (true);

-- Habilita o realtime (atualização automática entre usuários conectados)
alter publication supabase_realtime add table tasks;

-- ============================================================
-- OPCIONAL: dados iniciais (as 12 pendências que já existiam
-- na versão em localStorage). Remova este bloco se não quiser
-- migrar os dados de exemplo.
-- ============================================================
insert into tasks (biz, assignee, title, status, priority, opened, due, notes) values
('3B Logistics EUA','Dudu','Liberação dos tablets','pending','high','2025-04-22',null,''),
('3B Logistics EUA','Dudu','Atualizar os próximos 5 veículos (títulos)','pending','medium','2025-04-22',null,'Trucks 01, 02, 03 — quais mais? Precisamos dos títulos'),
('3B Logistics EUA','Dudu','RTS Factory','pending','high','2025-04-22',null,''),
('3B Logistics EUA','Dudu','RTS cartão combustível','pending','high','2025-04-22',null,'Cartões a caminho do Grupo 3B Orlando'),
('3B Logistics EUA','Dudu','Configuração do Prespass','pending','medium','2025-04-22',null,''),
('3B Logistics EUA','Dudu','Seguro de carga','pending','high','2025-04-22',null,'Previsão de liberação hoje — assunto URGENTE'),
('3B Logistics EUA','Dudu','Confirmação do seguro dos motoristas por e-mail','pending','high','2025-04-22',null,''),
('3B Logistics EUA','Dudu','Inspeção dos trailers','pending','high','2025-04-22',null,''),
('3B Logistics EUA','Dudu','Atualizar os próximos 5 trailers','pending','medium','2025-04-22',null,''),
('3B Logistics EUA','Dudu','Atualizar planilha com motoristas interessados','pending','medium','2025-04-22',null,''),
('3B Logistics EUA','Dudu','Melhorar planilhas financeiras','pending','medium','2025-04-22',null,''),
('3B Logistics EUA','Dudu','Acesso ao QuickBooks','pending','medium','2025-04-22',null,'');
