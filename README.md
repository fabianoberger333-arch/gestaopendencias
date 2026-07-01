# Grupo 3B — Gestão de Pendências

Sistema de gestão de tarefas conectado a um banco de dados (Supabase/Postgres),
com login compartilhado e atualização em tempo real entre usuários. Site
estático, sem etapa de build — pode ser aberto direto ou hospedado em
qualquer provedor de sites estáticos (Vercel, Netlify, GitHub Pages).

## Arquitetura

- **Frontend**: HTML/CSS/JS puro (sem framework, sem build). `app.js` usa o
  cliente oficial `@supabase/supabase-js` via CDN (`esm.sh`).
- **Backend/Banco**: [Supabase](https://supabase.com) (Postgres gerenciado +
  autenticação + API + realtime), plano gratuito é suficiente para esse uso.
- **Autenticação**: uma única conta (e-mail/senha) compartilhada pela equipe,
  usando o Supabase Auth de verdade — não é apenas uma senha fixa no código.
- **Segurança dos dados**: Row Level Security (RLS) ativado na tabela
  `tasks`. Sem estar autenticado, ninguém consegue ler ou escrever dados,
  mesmo conhecendo a URL do projeto.

## 1. Criar o projeto no Supabase

1. Crie uma conta em https://supabase.com e um novo projeto (escolha uma
   senha forte para o banco — ela não será usada pelo frontend).
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole todo o
   conteúdo de [`supabase-schema.sql`](supabase-schema.sql) e execute.
   Isso cria a tabela `tasks`, ativa o RLS e as políticas de acesso.
3. Vá em **Authentication → Users → Add user** e crie o usuário
   compartilhado da equipe (ex.: `equipe@grupo3b.com` + uma senha forte).
   Marque **Auto Confirm User** para não precisar de e-mail de confirmação.

## 2. Configurar as credenciais no código

1. Em **Project Settings → API**, copie o **Project URL** e a **anon public
   key**.
2. Edite [`config.js`](config.js) e substitua os valores de exemplo:

   ```js
   export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
   export const SUPABASE_ANON_KEY = 'SUA_ANON_PUBLIC_KEY_AQUI';
   ```

   > A `anon key` **não é secreta** — ela é feita para rodar no navegador do
   > usuário. A proteção real é o RLS (passo 1). **Nunca** use a
   > `service_role key` no frontend; ela dá acesso total ao banco ignorando
   > o RLS e deve ficar apenas no painel do Supabase.

## 3. Testar localmente

Como o app usa ES Modules, é preciso servir os arquivos por HTTP (abrir o
`index.html` direto como `file://` não funciona). Qualquer servidor estático
simples resolve, por exemplo com Python:

```bash
python3 -m http.server 8080
```

Acesse `http://localhost:8080` e faça login com o e-mail/senha criados no
passo 1.3.

## 4. Subir para o GitHub

```bash
git add -A
git commit -m "Sistema de gestão de tarefas com Supabase"
```

Crie um repositório vazio em https://github.com/new (não inicialize com
README) e depois:

```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git branch -M main
git push -u origin main
```

## 5. Hospedar na Vercel

1. Acesse https://vercel.com, entre com sua conta GitHub e clique em
   **Add New → Project**, selecione o repositório criado.
2. Em **Framework Preset**, escolha **Other**. Deixe **Build Command** e
   **Output Directory** em branco (é um site estático, não há build).
3. Clique em **Deploy**. Em poucos segundos o site estará acessível pela
   internet em uma URL `https://SEU-PROJETO.vercel.app`.

Qualquer novo `git push` na branch `main` gera um novo deploy automático.

## Segurança — resumo do que foi aplicado

- **RLS habilitado**: sem sessão autenticada, nenhuma linha da tabela
  `tasks` pode ser lida, criada, editada ou apagada via API.
- **Só a anon key roda no cliente**: é a única chave feita para ser pública;
  a `service_role key` nunca é usada neste projeto.
- **Senha do banco de dados**: definida apenas na criação do projeto
  Supabase, nunca aparece em código nem é usada pelo frontend.
- **Login real via Supabase Auth**: mesmo sendo uma conta compartilhada, a
  sessão usa tokens JWT com expiração, não uma senha fixa comparada no
  JavaScript do navegador.
- **HTTPS obrigatório**: tanto Supabase quanto Vercel servem tudo por HTTPS.

### Recomendações adicionais

- Troque a senha da conta compartilhada periodicamente (Authentication →
  Users → editar usuário).
- Se quiser saber *quem* fez cada alteração no futuro, é possível migrar
  para contas individuais por pessoa — o RLS já está pronto para isso
  (bastaria trocar `to authenticated` por regras baseadas em `auth.uid()`).
- Nunca commite a `service_role key` em nenhum arquivo do repositório.

## Estrutura de arquivos

```
index.html            → página principal + tela de login
style.css             → todo o CSS (extraído do design original)
app.js                → lógica da aplicação (CRUD via Supabase + auth)
config.js             → credenciais públicas do Supabase (URL + anon key)
supabase-schema.sql    → schema do banco (tabela, RLS, dados iniciais opcionais)
grupo3b-gestao_7.html → versão original (estática, dados em localStorage) — mantida como referência
```
