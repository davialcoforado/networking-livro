/* ════════════════════════════════════════════════════════════════
   NETWORKING IS KING — Configurações de integração
   config.js

   PASSO 1 — FORMSPREE (notificação por e-mail)
   ─────────────────────────────────────────────
   1. Acesse formspree.io/register e crie uma conta
   2. Crie um novo form → dê um nome (ex: "Landing Networking King")
   3. Copie o ID (8 caracteres, ex: "xwkgpqra")
   4. Substitua FORMSPREE_ID abaixo pelo seu ID

   PASSO 2 — SUPABASE (banco de dados dos leads)
   ──────────────────────────────────────────────
   1. Acesse supabase.com → "Start your project" → crie conta
   2. Crie um novo projeto (ex: "networking-king") → aguarde inicializar
   3. Vá em Settings → API:
      - Copie a "Project URL"  → SUPABASE_URL abaixo
      - Copie a "anon public"  → SUPABASE_ANON_KEY abaixo
   4. Vá em SQL Editor → New query → cole e execute o SQL abaixo:

   ────────────── SQL PARA COPIAR NO SUPABASE ──────────────

   create table leads (
     id                     uuid        default gen_random_uuid() primary key,
     created_at             timestamptz default now(),
     name                   text        not null,
     email                  text        not null,
     whatsapp               text,
     country                text,
     state                  text,
     zip                    text,
     source                 text        not null default 'landing',
     quadrant_key           text,
     quadrant_name          text,
     score_intencionalidade integer,
     score_postura          integer,
     answers                jsonb
   );

   alter table leads enable row level security;

   create policy "anon pode inserir leads"
     on leads for insert
     to anon
     with check (true);

   create policy "autenticado pode ver leads"
     on leads for select
     to authenticated
     using (true);

   ─────────────────────────────────────────────────────────

   A anon key é segura para ficar no código público:
   ela só permite INSERT (configurado acima), nunca SELECT.
   Para VER os leads: acesse o painel do Supabase ou crie login.
════════════════════════════════════════════════════════════════ */

// ── Formspree ─────────────────────────────────────────────────
// Substitua "XXXXXXXX" pelo ID do seu form no Formspree
const FORMSPREE_ID  = 'mqevenjw';
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;

// ── Supabase ──────────────────────────────────────────────────
// Substitua pelos valores do seu projeto em supabase.com → Settings → API
const SUPABASE_URL      = 'https://XXXXXXXXXXXX.supabase.co';
const SUPABASE_ANON_KEY = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// ─────────────────────────────────────────────────────────────
// Inicialização do cliente — não edite abaixo desta linha
// ─────────────────────────────────────────────────────────────
let db = null;

function initSupabase() {
  const configured =
    SUPABASE_URL      !== 'https://XXXXXXXXXXXX.supabase.co' &&
    SUPABASE_ANON_KEY !== 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  if (!configured) return;

  if (typeof window !== 'undefined' && window.supabase) {
    const { createClient } = window.supabase;
    db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

// ── Salvar lead no Supabase (silencioso — nunca bloqueia a UI) ─
async function saveLead(data) {
  if (!db) return;
  try {
    await db.from('leads').insert(data);
  } catch (_) {
    // falha silenciosa — não impede a experiência do usuário
  }
}
