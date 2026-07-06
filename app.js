import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── BUSINESSES ────────────────────────────────────────
const BUSINESSES = [
  { id: 'all',               label: 'Todos',              color: '#1B3A5C' },
  { id: '3B Logistics EUA',  label: '3B Logistics EUA',   color: '#2A5C3F' },
  { id: '3B Logística Brasil', label: '3B Logística Brasil', color: '#1B3A5C' },
  { id: '3B & Moufarrege',   label: '3B & Moufarrege',    color: '#7A5C1E' },
  { id: 'Particulares',      label: 'Particulares',       color: '#5C2A2A' },
  { id: 'FJ Transport',      label: 'FJ Transport',       color: '#3A2A5C' },
  { id: 'Outros',            label: 'Outros',             color: '#3D3830' },
];

let activeBiz = 'all';

function renderBizTabs() {
  const wrap = document.getElementById('bizTabs');
  wrap.innerHTML = BUSINESSES.map(b => {
    const cnt = b.id === 'all'
      ? tasks.length
      : tasks.filter(t => t.biz === b.id).length;
    return `<button
      class="biz-tab ${b.id === 'all' ? 'biz-tab-all' : ''} ${activeBiz === b.id ? 'active' : ''}"
      onclick="selectBiz('${b.id}')"
    >
      <span class="biz-tab-dot" style="background:${b.color}"></span>
      ${b.label}
      <span class="biz-tab-count">${cnt}</span>
    </button>`;
  }).join('');
}

function selectBiz(id) {
  activeBiz = id;
  page = 1;
  render();
}

// ── DATA ──────────────────────────────────────────────
const SL = { pending:'Pendente', progress:'Em Andamento', done:'Concluído', blocked:'Bloqueado', 'not-started':'Não Iniciado' };
const PL = { high:'Alta', medium:'Média', low:'Baixa' };

function avClass(name) {
  const n = (name||'').toLowerCase();
  if (n === 'dudu') return 'av-dudu';
  return 'av-default';
}

function toBR(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

let tasks = [];
let sortField='id', sortDir=1, editId=null, page=1, viewMode='list';
const PER = 10;
let realtimeChannel = null;

// ── AUTH ──────────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  session ? await showApp() : showLogin();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session) await showApp(); else showLogin();
  });
}

function showLogin() {
  document.getElementById('loginOverlay').classList.add('open');
  document.getElementById('appRoot').style.display = 'none';
  if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
}

async function showApp() {
  document.getElementById('loginOverlay').classList.remove('open');
  document.getElementById('appRoot').style.display = '';
  await loadTasks();
  render();
  subscribeRealtime();
}

function subscribeRealtime() {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel('tasks-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => {
      await loadTasks();
      render();
    })
    .subscribe();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) errEl.textContent = 'E-mail ou senha inválidos.';
});

window.logout = async function logout() {
  await supabase.auth.signOut();
};

// ── SIDEBAR MOBILE ────────────────────────────────────
function toggleSidebar(force) {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
}
window.toggleSidebar = toggleSidebar;

// ── PERSISTÊNCIA (Supabase) ───────────────────────────
async function loadTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('id', { ascending: true });
  if (error) { showToast('Erro ao carregar tarefas', true); console.error(error); return; }
  tasks = data;
}

// ── FILTER ────────────────────────────────────────────
function filtered() {
  const s  = document.getElementById('searchInput').value.toLowerCase();
  const fs = document.getElementById('fStatus').value;
  const fp = document.getElementById('fPrio').value;
  const fa = document.getElementById('fAsgn').value;
  return tasks.filter(t => {
    if (activeBiz !== 'all' && t.biz !== activeBiz) return false;
    if (fs && t.status   !== fs) return false;
    if (fp && t.priority !== fp) return false;
    if (fa && t.assignee !== fa) return false;
    if (s  && !`${t.id} ${t.title} ${t.assignee} ${t.notes}`.toLowerCase().includes(s)) return false;
    return true;
  });
}

// ── RENDER ────────────────────────────────────────────
function render() {
  renderBizTabs();
  updateKPIs();
  updateAsgnFilter();
  viewMode === 'group' ? renderGrouped() : renderList();
}

function updateAsgnFilter() {
  const sel = document.getElementById('fAsgn');
  const current = sel.value;
  const names = [...new Set(tasks.map(t => t.assignee).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">Todos Responsáveis</option>' +
    names.map(n => `<option value="${n}" ${n === current ? 'selected' : ''}>${n}</option>`).join('');
}

function updateKPIs() {
  const scope = activeBiz === 'all' ? tasks : tasks.filter(t => t.biz === activeBiz);
  document.getElementById('kpi-total').textContent   = scope.length;
  document.getElementById('kpi-pending').textContent = scope.filter(t=>t.status==='pending').length;
  document.getElementById('kpi-prog').textContent    = scope.filter(t=>t.status==='progress').length;
  document.getElementById('kpi-block').textContent   = scope.filter(t=>t.status==='blocked').length;
  document.getElementById('kpi-done').textContent    = scope.filter(t=>t.status==='done').length;
  document.getElementById('kpi-high').textContent    = scope.filter(t=>t.priority==='high'&&t.status!=='done').length;
}

function renderList() {
  let data = filtered();
  data.sort((a,b) => {
    const va = String(a[sortField]||'').toLowerCase();
    const vb = String(b[sortField]||'').toLowerCase();
    return va < vb ? -sortDir : va > vb ? sortDir : 0;
  });

  const tot = data.length, tp = Math.max(1, Math.ceil(tot/PER));
  if (page > tp) page = 1;
  const s  = (page-1)*PER;
  const pg = data.slice(s, s+PER);

  document.getElementById('pgInfo').textContent =
    `Exibindo ${tot===0?0:s+1}–${Math.min(s+PER,tot)} de ${tot} tarefa${tot!==1?'s':''}`;

  buildPager(tp);

  const tbody = document.getElementById('tableBody');
  if (!pg.length) { tbody.innerHTML = emptyHTML(); return; }
  tbody.innerHTML = pg.map((t,i) => rowHTML(t,i)).join('');
}

function renderGrouped() {
  const data = filtered();
  const grp  = {};
  data.forEach(t => { (grp[t.assignee] = grp[t.assignee]||[]).push(t); });

  const tot = data.length;
  document.getElementById('pgInfo').textContent =
    `${tot} tarefa${tot!==1?'s':''} · ${Object.keys(grp).length} responsável(is)`;
  document.getElementById('pgBtns').innerHTML = '';

  const tbody = document.getElementById('tableBody');
  if (!data.length) { tbody.innerHTML = emptyHTML(); return; }

  const ORDER = ['Dudu'];
  const keys  = [...ORDER.filter(k=>grp[k]), ...Object.keys(grp).filter(k=>!ORDER.includes(k))];
  let html = '';
  keys.forEach(asgn => {
    const cnt = grp[asgn].length;
    const ac  = avClass(asgn);
    html += `<tr class="grp-row"><td colspan="9">
      <span class="av ${ac}" style="display:inline-flex;margin-right:8px;vertical-align:middle">${asgn[0]}</span>
      ${asgn} &nbsp;·&nbsp; ${cnt} tarefa${cnt!==1?'s':''}
    </td></tr>`;
    grp[asgn].forEach((t,i) => { html += rowHTML(t,i); });
  });
  tbody.innerHTML = html;
}

function buildPager(tp) {
  const pb = document.getElementById('pgBtns');
  pb.innerHTML = '';
  for (let i=1; i<=tp; i++) {
    const b = document.createElement('button');
    b.className = 'pg-btn' + (i===page?' active':'');
    b.textContent = i;
    b.onclick = () => { page=i; render(); };
    pb.appendChild(b);
  }
}

function rowHTML(t, i) {
  const today = new Date().toISOString().split('T')[0];
  let dateCls = 'date-cell', dateVal = toBR(t.due) || '—';
  if (t.due && t.status !== 'done') {
    if      (t.due < today)  dateCls = 'date-cell date-overdue';
    else if (t.due === today) dateCls = 'date-cell date-today';
  }

  const notesHtml = t.notes
    ? `<span title="${t.notes.replace(/"/g,"'")}" class="notes-cell">${t.notes.length>40?t.notes.slice(0,38)+'…':t.notes}</span>`
    : `<span style="color:var(--border2)">—</span>`;

  const doneBtn = t.status!=='done'
    ? `<button class="act-btn done" onclick="markDone(${t.id})" title="Concluir">✓</button>` : '';

  return `<tr style="animation-delay:${i*.03}s">
    <td class="id-col">${t.id}</td>
    <td><span class="task-title" title="${t.title}">${t.title}</span></td>
    <td><span class="pill st-${t.status}"><span class="pill-dot"></span>${SL[t.status]||t.status}</span></td>
    <td><span class="prio pr-${t.priority}">${PL[t.priority]||t.priority}</span></td>
    <td><div class="asgn"><div class="av ${avClass(t.assignee)}">${t.assignee[0]}</div>${t.assignee}</div></td>
    <td class="date-cell">${toBR(t.opened)||'—'}</td>
    <td class="${dateCls}">${dateVal}</td>
    <td>${notesHtml}</td>
    <td><div class="row-actions">
      ${doneBtn}
      <button class="act-btn edit" onclick="editTask(${t.id})" title="Editar">✎</button>
      <button class="act-btn del"  onclick="delTask(${t.id})"  title="Remover">✕</button>
    </div></td>
  </tr>`;
}

function emptyHTML() {
  return `<tr><td colspan="9"><div class="empty">
    <div class="empty-icon">◻</div>
    <p>Nenhuma tarefa encontrada</p>
  </div></td></tr>`;
}

function sortBy(f) {
  if (sortField===f) sortDir*=-1; else { sortField=f; sortDir=1; }
  render();
}

function setView(v) {
  viewMode = v;
  document.getElementById('vt-list').classList.toggle('active', v==='list');
  document.getElementById('vt-group').classList.toggle('active', v==='group');
  render();
}

// ── MODAL ────────────────────────────────────────────
function openModal(id=null) {
  editId = id;
  document.getElementById('modalTitle').textContent = id ? 'Editar Tarefa' : 'Nova Tarefa';
  if (id) {
    const t = tasks.find(x=>x.id===id);
    document.getElementById('f-biz').value    = t.biz || '3B Logistics EUA';
    document.getElementById('f-title').value  = t.title;
    document.getElementById('f-status').value = t.status;
    document.getElementById('f-prio').value   = t.priority;
    document.getElementById('f-asgn').value   = t.assignee;
    document.getElementById('f-due').value    = t.due || '';
    document.getElementById('f-notes').value  = t.notes || '';
  } else {
    ['f-title','f-asgn','f-due','f-notes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('f-biz').value    = activeBiz !== 'all' ? activeBiz : '3B Logistics EUA';
    document.getElementById('f-status').value = 'pending';
    document.getElementById('f-prio').value   = 'medium';
  }
  document.getElementById('overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  editId = null;
}

async function saveTask() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { showToast('Título é obrigatório', true); return; }
  const data = {
    biz:      document.getElementById('f-biz').value,
    title,
    status:   document.getElementById('f-status').value,
    priority: document.getElementById('f-prio').value,
    assignee: document.getElementById('f-asgn').value || 'Não atribuído',
    due:      document.getElementById('f-due').value || null,
    notes:    document.getElementById('f-notes').value,
  };

  if (editId) {
    const { error } = await supabase.from('tasks').update(data).eq('id', editId);
    if (error) { showToast('Erro ao atualizar tarefa', true); console.error(error); return; }
    showToast('Tarefa atualizada');
  } else {
    const { error } = await supabase.from('tasks').insert([data]);
    if (error) { showToast('Erro ao criar tarefa', true); console.error(error); return; }
    showToast('Tarefa criada com sucesso');
  }
  await loadTasks();
  closeModal();
  render();
}

function editTask(id) { openModal(id); }

async function markDone(id) {
  const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', id);
  if (error) { showToast('Erro ao concluir tarefa', true); console.error(error); return; }
  await loadTasks();
  render();
  showToast('Tarefa concluída');
}

async function delTask(id) {
  if (!confirm('Remover esta tarefa?')) return;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) { showToast('Erro ao remover tarefa', true); console.error(error); return; }
  await loadTasks();
  render();
  showToast('Tarefa removida');
}

// ── TOAST ────────────────────────────────────────────
let toastTimer;
function showToast(msg, err=false) {
  const el = document.getElementById('toast');
  el.classList.toggle('err', err);
  document.getElementById('toastMsg').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 3000);
}

// ── Expõe funções usadas em atributos onclick do HTML ─
window.openModal  = openModal;
window.closeModal = closeModal;
window.saveTask   = saveTask;
window.editTask   = editTask;
window.markDone   = markDone;
window.delTask    = delTask;
window.sortBy     = sortBy;
window.setView    = setView;
window.selectBiz  = selectBiz;
window.render     = render;

// ── INIT ─────────────────────────────────────────────
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});

document.getElementById('headerDate').textContent =
  new Date().toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});

window.addEventListener('resize', () => { if (window.innerWidth > 768) toggleSidebar(false); });

initAuth();
