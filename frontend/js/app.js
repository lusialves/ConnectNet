'use strict';
const api = window.connectnet;
const state = { user: null, module: 'dashboard', rows: [], filters: {}, version: 0 };
const main = document.querySelector('#content');
const dialog = document.querySelector('#record-dialog');
const recordForm = document.querySelector('#record-form');
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const labels = { ADMIN: 'Administrador', SUPORTE: 'Suporte técnico', CLIENTE: 'Cliente', ATIVO: 'Ativo', INATIVO: 'Inativo', PENDENTE: 'Pendente', PAGA: 'Paga', CANCELADA: 'Cancelada', ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em atendimento', RESOLVIDO: 'Resolvido', BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta' };
const modules = {
  clientes: { title: 'Clientes', description: 'Cadastros, planos contratados e situação dos assinantes.', singular: 'cliente', statuses: ['ATIVO', 'INATIVO'], columns: [['nome', 'Cliente'], ['email', 'E-mail'], ['telefone', 'Telefone'], ['plano_nome', 'Plano'], ['status', 'Situação']] },
  planos: { title: 'Planos', description: 'Organize o catálogo de velocidades e mensalidades.', singular: 'plano', statuses: [], columns: [['nome', 'Plano'], ['velocidade', 'Velocidade'], ['preco', 'Mensalidade'], ['descricao', 'Descrição']] },
  faturas: { title: 'Faturas', description: 'Acompanhe as cobranças e registre os pagamentos.', singular: 'fatura', statuses: ['PENDENTE', 'PAGA', 'CANCELADA'], columns: [['cliente_nome', 'Cliente'], ['competencia', 'Competência'], ['valor', 'Valor'], ['data_vencimento', 'Vencimento'], ['status', 'Situação']] },
  chamados: { title: 'Chamados', description: 'Organize as solicitações de suporte e acompanhe o atendimento.', singular: 'chamado', statuses: ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO'], columns: [['cliente_nome', 'Cliente'], ['descricao', 'Solicitação'], ['data_abertura', 'Abertura'], ['prioridade', 'Prioridade'], ['status', 'Situação']] },
};
let formAction = null; let notificationTimer;
function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function button(text, className, handler) { const result = element('button', `button ${className}`, text); result.type = 'button'; if (handler) result.addEventListener('click', handler); return result; }
function notify(message, isError = false) { const node = document.querySelector('#notification'); node.textContent = message; node.classList.toggle('error', isError); node.hidden = false; clearTimeout(notificationTimer); notificationTimer = setTimeout(() => { node.hidden = true; }, 5500); }
function dateText(value) { return value ? value.split('-').reverse().join('/') : '-'; }
function pendingText(count) { return `${count} ${count === 1 ? 'fatura pendente' : 'faturas pendentes'}`; }
function newLabel(name) { return `${name === 'faturas' ? 'Nova' : 'Novo'} ${modules[name].singular}`; }
function valueText(key, value) { if (['preco', 'valor'].includes(key)) return brl.format(value); if (key.startsWith('data_')) return dateText(value); if (key === 'competencia') return value.split('-').reverse().join('/'); return labels[value] || String(value ?? '-'); }
function badge(value) { return element('span', `badge badge-${value.toLowerCase()}`, labels[value] || value); }
function heading(title, description) {
  const row = element('div', 'page-heading'); const texts = element('div');
  texts.append(element('p', 'eyebrow', 'CONNECTNET'), element('h1', null, title), element('p', 'muted', description)); row.append(texts); main.append(row); return row;
}
function navigate(module) { state.module = module; render().catch(handleError); }
function handleError(error) { if (error.status === 401) location.replace('/login.html'); else notify(error.message, true); }
function navigation() {
  const allowed = ['dashboard'];
  if (state.user.perfil === 'ADMIN') allowed.push('clientes', 'planos', 'faturas');
  if (state.user.perfil === 'CLIENTE') allowed.push('faturas');
  allowed.push('chamados');
  const nav = document.querySelector('#navigation'); nav.replaceChildren();
  for (const name of allowed) { const link = button(name === 'dashboard' ? 'Visão geral' : modules[name].title, 'nav-link', () => navigate(name)); link.dataset.module = name; nav.append(link); }
}
function activeNav() { document.querySelectorAll('[data-module]').forEach(node => { node.classList.toggle('active', node.dataset.module === state.module); if (node.dataset.module === state.module) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current'); }); }
function metric(label, value, hint) { const card = element('section', 'metric-card'); card.append(element('p', 'metric-label', label), element('strong', 'metric-value', value), element('p', 'metric-hint', hint)); return card; }
function table(rows, module, actions = true) {
  const settings = modules[module]; const wrap = element('div', 'table-wrap'); wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', `Tabela de ${settings.title.toLowerCase()}`);
  if (!rows.length) { const empty = element('div', 'empty-state'); empty.append(element('strong', null, 'Nenhum registro encontrado'), element('p', 'muted', 'Ajuste os filtros ou cadastre um novo registro.')); wrap.append(empty); return wrap; }
  const result = element('table'); const thead = element('thead'); const header = element('tr');
  const canEdit = state.user.perfil === 'ADMIN' || (module === 'chamados' && state.user.perfil === 'SUPORTE');
  const showActions = actions && canEdit;
  for (const [, text] of settings.columns) { const th = element('th', null, text); th.scope = 'col'; header.append(th); }
  if (showActions) { const th = element('th', null, 'Ações'); th.scope = 'col'; header.append(th); }
  thead.append(header); result.append(thead); const tbody = element('tbody');
  for (const row of rows) {
    const tr = element('tr');
    for (const [key] of settings.columns) {
      const td = element('td', ['nome', 'cliente_nome'].includes(key) ? 'cell-name' : null);
      if (['status', 'prioridade'].includes(key)) td.append(badge(row[key]));
      else { td.textContent = valueText(key, row[key]); if (['descricao', 'endereco'].includes(key)) { td.className = 'cell-description'; td.title = td.textContent; } }
      tr.append(td);
    }
    if (showActions) {
      const td = element('td', 'table-actions');
      if (module === 'faturas' && row.status === 'PENDENTE') td.append(button('Marcar paga', 'small positive', async () => { try { await api.request(`/faturas/${row.id}`, { method: 'PUT', body: { status: 'PAGA' } }); notify('Pagamento registrado.'); await render(); } catch (error) { handleError(error); } }));
      td.append(button('Editar', 'small subtle', () => openForm(module, row).catch(handleError)));
      if (state.user.perfil === 'ADMIN') td.append(button('Excluir', 'small text-danger', () => confirmRemove(module, row)));
      tr.append(td);
    }
    tbody.append(tr);
  }
  result.append(tbody); wrap.append(element('p', 'mobile-table-hint', 'Deslize a tabela para consultar as demais colunas.'), result); return wrap;
}
async function dashboard(version) {
  const data = await api.request('/dashboard'); if (version !== state.version) return;
  main.replaceChildren();
  heading('Visão geral', `Olá, ${state.user.nome}. Acompanhe as operações do seu provedor.`);
  const cards = element('div', 'metrics');
  if (state.user.perfil === 'ADMIN') cards.append(metric('Clientes ativos', String(data.clientes_ativos), `${data.planos} planos no catálogo`), metric('Valor a receber', brl.format(data.valor_pendente), pendingText(data.faturas_pendentes)), metric('Recebimentos', brl.format(data.valor_recebido), 'Total das faturas marcadas como pagas'), metric('Chamados em aberto', String(data.chamados_abertos), 'Abertos ou em atendimento'));
  if (state.user.perfil === 'SUPORTE') cards.append(metric('Chamados em aberto', String(data.chamados_abertos), 'Abertos ou em atendimento'), metric('Sua central', 'Suporte', 'Atualize o status e a prioridade dos chamados'));
  if (state.user.perfil === 'CLIENTE') cards.append(metric('Meu plano', data.meu_plano.nome, `${data.meu_plano.velocidade} · ${brl.format(data.meu_plano.preco)}/mês`), metric('Minhas faturas', brl.format(data.valor_pendente), pendingText(data.faturas_pendentes)), metric('Meus chamados', String(data.chamados_abertos), 'Solicitações abertas ou em atendimento'));
  main.append(cards);
  const shortcuts = element('div', 'quick-actions');
  if (state.user.perfil === 'ADMIN') shortcuts.append(button('Cadastrar cliente', 'primary', () => openForm('clientes').catch(handleError)), button('Ver faturas', 'subtle', () => navigate('faturas')));
  shortcuts.append(button(state.user.perfil === 'CLIENTE' ? 'Abrir chamado' : 'Acessar suporte', 'subtle', () => state.user.perfil === 'CLIENTE' ? openForm('chamados').catch(handleError) : navigate('chamados')));
  main.append(shortcuts);
  const tickets = element('section', 'panel'); const ticketHead = element('div', 'panel-heading'); ticketHead.append(element('h2', null, 'Chamados recentes'), button('Ver todos', 'small subtle', () => navigate('chamados'))); tickets.append(ticketHead, table(data.chamados, 'chamados', false)); main.append(tickets);
  if (state.user.perfil !== 'SUPORTE') { const invoices = element('section', 'panel'); const invoiceHead = element('div', 'panel-heading'); invoiceHead.append(element('h2', null, 'Últimas faturas'), button('Ver todas', 'small subtle', () => navigate('faturas'))); invoices.append(invoiceHead, table(data.faturas, 'faturas', false)); main.append(invoices); }
}
async function collection(version) {
  const name = state.module; const settings = modules[name]; const filters = state.filters[name] || {};
  const params = new URLSearchParams(); if (filters.q) params.set('q', filters.q); if (filters.status) params.set('status', filters.status);
  const rows = await api.request(`/${name}?${params}`); if (version !== state.version) return;
  state.rows = rows; main.replaceChildren(); const top = heading(settings.title, settings.description);
  const canCreate = state.user.perfil === 'ADMIN' || name === 'chamados';
  const actions = element('div', 'page-actions');
  if (name === 'faturas' && state.user.perfil === 'ADMIN') actions.append(button('Gerar mensalidade', 'subtle', () => openGenerate()));
  if (canCreate) actions.append(button(newLabel(name), 'primary', () => openForm(name).catch(handleError)));
  top.append(actions);
  const panel = element('section', 'panel'); const toolbar = element('form', 'toolbar'); toolbar.setAttribute('role', 'search');
  const input = element('input'); input.type = 'search'; input.placeholder = 'Buscar nesta lista'; input.value = filters.q || ''; input.maxLength = 120; input.setAttribute('aria-label', `Buscar ${settings.title.toLowerCase()}`);
  toolbar.append(input);
  let select;
  if (settings.statuses.length) {
    select = element('select'); select.setAttribute('aria-label', 'Filtrar por situação'); const all = element('option', null, 'Todas as situações'); all.value = ''; select.append(all);
    for (const status of settings.statuses) { const option = element('option', null, labels[status]); option.value = status; select.append(option); } select.value = filters.status || ''; toolbar.append(select);
    select.addEventListener('change', () => { state.filters[name] = { q: input.value, status: select.value }; render().catch(handleError); });
  }
  const search = button('Buscar', 'subtle'); search.type = 'submit'; toolbar.append(search, element('span', 'record-count', `${rows.length} registro${rows.length === 1 ? '' : 's'}`));
  toolbar.addEventListener('submit', event => { event.preventDefault(); state.filters[name] = { q: input.value, status: select?.value || '' }; render().catch(handleError); });
  panel.append(toolbar, table(rows, name)); main.append(panel);
}
async function render() { const version = ++state.version; activeNav(); main.setAttribute('aria-busy', 'true'); try { if (state.module === 'dashboard') await dashboard(version); else await collection(version); } finally { if (version === state.version) main.removeAttribute('aria-busy'); } }
function field(spec, value) {
  const wrap = element('div', `field ${spec.wide ? 'wide' : ''}`); const label = element('label', null, spec.label); label.htmlFor = `field-${spec.name}`;
  const control = element(spec.type === 'textarea' ? 'textarea' : spec.options ? 'select' : 'input'); control.id = label.htmlFor; control.name = spec.name;
  if (control.tagName === 'INPUT') control.type = spec.type || 'text';
  if (spec.required) control.required = true;
  if (spec.max) control.maxLength = spec.max;
  if (spec.min) control.minLength = spec.min;
  if (spec.type === 'number') { control.min = '0.01'; control.max = '9999999.99'; control.step = '0.01'; }
  if (spec.type === 'password') control.autocomplete = 'new-password';
  if (spec.options) for (const [optionValue, optionText] of spec.options) { const option = element('option', null, optionText); option.value = optionValue; control.append(option); }
  control.value = value ?? spec.default ?? ''; wrap.append(label, control); if (spec.help) wrap.append(element('small', 'muted', spec.help)); return wrap;
}
function setupForm(title, specs, values, action) {
  document.querySelector('#dialog-title').textContent = title; document.querySelector('#form-error').hidden = true;
  const fields = document.querySelector('#dialog-fields'); fields.replaceChildren(...specs.map(spec => field(spec, values[spec.name])));
  formAction = action; dialog.showModal(); fields.querySelector('input,select,textarea')?.focus();
}
async function openForm(name, row = null) {
  const editing = !!row; const date = new Date().toISOString().slice(0, 10); let specs = [];
  const options = values => values.map(value => [value, labels[value]]);
  if (name === 'planos') specs = [
    { name: 'nome', label: 'Nome do plano', required: true, min: 2, max: 100 }, { name: 'velocidade', label: 'Velocidade', required: true, max: 50 },
    { name: 'preco', label: 'Mensalidade em R$', type: 'number', required: true }, { name: 'descricao', label: 'Descrição', type: 'textarea', wide: true, max: 500 },
  ];
  if (name === 'clientes') {
    const plans = await api.request('/planos'); if (!plans.length) throw new Error('Cadastre um plano antes de cadastrar clientes.');
    specs = [
      { name: 'nome', label: 'Nome completo', required: true, min: 2, max: 150 }, { name: 'email', label: 'E-mail de acesso', type: 'email', required: true, max: 150 },
      { name: 'telefone', label: 'Telefone', type: 'tel', required: true, min: 8, max: 20 }, { name: 'plano_id', label: 'Plano contratado', options: plans.map(plan => [plan.id, `${plan.nome} · ${brl.format(plan.preco)}`]), required: true },
      { name: 'status', label: 'Situação', options: options(['ATIVO', 'INATIVO']), default: 'ATIVO' },
      { name: 'senha', label: editing ? 'Nova senha opcional' : 'Senha de acesso', type: 'password', required: !editing, min: 8, max: 128, help: editing ? 'Deixe em branco para manter a senha atual.' : 'Use ao menos 8 caracteres.' },
      { name: 'endereco', label: 'Endereço', required: true, min: 5, max: 255, wide: true },
    ];
  }
  if (name === 'faturas') {
    if (!editing) {
      const clients = (await api.request('/clientes')).filter(client => client.status === 'ATIVO'); if (!clients.length) throw new Error('Cadastre um cliente ativo antes de emitir uma fatura.');
      specs.push({ name: 'cliente_id', label: 'Cliente', options: clients.map(client => [client.id, client.nome]), required: true }, { name: 'competencia', label: 'Competência', type: 'month', default: date.slice(0, 7), required: true });
    }
    specs.push({ name: 'valor', label: 'Valor em R$', type: 'number', required: true }, { name: 'data_vencimento', label: 'Vencimento', type: 'date', default: date, required: true });
    if (editing) specs.push({ name: 'status', label: 'Situação', options: options(['PENDENTE', 'PAGA', 'CANCELADA']), required: true });
  }
  if (name === 'chamados') {
    if (!editing && state.user.perfil !== 'CLIENTE') {
      const clients = (await api.request('/clientes')).filter(client => client.status === 'ATIVO'); if (!clients.length) throw new Error('Não há clientes ativos para abrir chamados.');
      specs.push({ name: 'cliente_id', label: 'Cliente', options: clients.map(client => [client.id, client.nome]), required: true });
    }
    specs.push({ name: 'prioridade', label: 'Prioridade', options: options(['BAIXA', 'MEDIA', 'ALTA']), default: 'MEDIA' });
    if (editing) specs.push({ name: 'status', label: 'Situação', options: options(['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO']), required: true });
    specs.push({ name: 'descricao', label: 'Descreva a solicitação', type: 'textarea', min: 8, max: 2000, wide: true, required: true });
  }
  setupForm(editing ? `Editar ${modules[name].singular}` : newLabel(name), specs, row || {}, async body => {
    if (body.senha === '') delete body.senha;
    await api.request(`/${name}${editing ? `/${row.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body });
    state.module = name; notify(editing ? 'Registro atualizado.' : 'Registro cadastrado.');
  });
}
function openGenerate() {
  const date = new Date().toISOString().slice(0, 10);
  setupForm('Gerar mensalidades', [{ name: 'competencia', label: 'Competência', type: 'month', required: true, default: date.slice(0, 7) }, { name: 'data_vencimento', label: 'Vencimento', type: 'date', required: true, default: date }], {}, async body => {
    const result = await api.request('/faturas/gerar', { method: 'POST', body }); notify(`${result.geradas} faturas geradas. ${result.existentes} já existiam nesta competência.`);
  });
}
recordForm.addEventListener('submit', async event => {
  event.preventDefault(); const save = document.querySelector('#save-record'); const errorMessage = document.querySelector('#form-error'); errorMessage.hidden = true; save.disabled = true; save.textContent = 'Salvando...';
  try { await formAction(Object.fromEntries(new FormData(recordForm))); dialog.close(); await render(); }
  catch (error) { if (error.status === 401) handleError(error); else { errorMessage.textContent = error.message; errorMessage.hidden = false; } }
  finally { save.disabled = false; save.textContent = 'Salvar'; }
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close()); document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
let deleteAction;
function confirmRemove(name, row) { const confirm = document.querySelector('#confirm-dialog'); document.querySelector('#confirm-message').textContent = `Excluir ${modules[name].singular} #${row.id}? Esta ação remove o registro.`; deleteAction = async () => { await api.request(`/${name}/${row.id}`, { method: 'DELETE' }); confirm.close(); notify('Registro excluído.'); await render(); }; confirm.showModal(); }
document.querySelector('#cancel-delete').addEventListener('click', () => document.querySelector('#confirm-dialog').close());
document.querySelector('#confirm-delete').addEventListener('click', async () => { const control = document.querySelector('#confirm-delete'); control.disabled = true; try { await deleteAction(); } catch (error) { document.querySelector('#confirm-dialog').close(); handleError(error); } finally { control.disabled = false; } });
document.querySelector('#logout').addEventListener('click', async () => { try { await api.request('/auth/logout', { method: 'POST' }); location.replace('/login.html'); } catch (error) { handleError(error); } });
(async () => {
  try {
    const session = await api.request('/auth/me'); state.user = session.usuario; document.querySelector('#user-name').textContent = state.user.nome; document.querySelector('#user-role').textContent = labels[state.user.perfil];
    document.querySelector('#demo-banner').hidden = session.modo !== 'demo'; navigation(); document.querySelector('#app').hidden = false; document.querySelector('#boot-status').hidden = true; await render();
  } catch (error) { if (error.status === 401) location.replace('/login.html'); else { const status = document.querySelector('#boot-status'); status.textContent = error.message; status.setAttribute('role', 'alert'); } }
})();
