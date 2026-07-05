// ============================================================
// Credenciais públicas do Supabase
// ============================================================
// A "anon key" abaixo NÃO é um segredo: ela é feita para ficar
// no navegador do usuário. Quem protege os dados de verdade é o
// Row Level Security (RLS) configurado em supabase-schema.sql,
// que só libera acesso para usuários autenticados.
//
// NUNCA coloque aqui a "service_role key" do Supabase — essa sim
// é secreta e nunca deve aparecer em código de frontend.
//
// Substitua os valores abaixo pelos do seu projeto:
// Supabase Dashboard → Project Settings → API
// ============================================================
export const SUPABASE_URL = 'https://thtusmqfhkgthxsnjtdm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodHVzbXFmaGtndGh4c25qdGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODA2MTAsImV4cCI6MjA5ODg1NjYxMH0.wnWBl8j1jfhI8TagnPVtZlqOm-aK81ccvU7vIljVu6o';
