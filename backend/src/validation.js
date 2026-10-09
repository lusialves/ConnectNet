'use strict';
class AppError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
function fail(message) { throw new AppError(400, 'DADOS_INVALIDOS', message); }
function text(value, label, min = 1, max = 150) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    fail(`${label}: informe entre ${min} e ${max} caracteres.`);
  }
  return value.trim();
}
function email(value) {
  const result = text(value, 'E-mail', 3, 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail('Informe um e-mail válido.');
  return result;
}
function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) fail('A senha deve ter entre 8 e 128 caracteres.');
  return value;
}
function id(value, label = 'ID') {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) fail(`${label} inválido.`);
  return Number(value);
}
function money(value, label = 'Valor') {
  const raw = String(value ?? '');
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw) || Number(raw) <= 0) fail(`${label} deve ser positivo e ter no máximo duas casas decimais.`);
  return Number(raw).toFixed(2);
}
function date(value, label = 'Data') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`${label} inválida.`);
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value || value < '2000-01-01' || value > '2100-12-31') fail(`${label} inválida.`);
  return value;
}
function month(value) {
  if (typeof value !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)) fail('Competência deve ter o formato AAAA-MM.');
  return value;
}
function choice(value, values, label) {
  if (!values.includes(value)) fail(`${label} deve ser ${values.join(', ')}.`);
  return value;
}
function patch(body, schema) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Envie um objeto JSON.');
  const result = {};
  for (const [key, fn] of Object.entries(schema)) if (Object.hasOwn(body, key)) result[key] = fn(body[key]);
  if (!Object.keys(result).length) fail('Nenhum campo válido foi informado.');
  return result;
}
const statuses = {
  cliente: ['ATIVO', 'INATIVO'], fatura: ['PENDENTE', 'PAGA', 'CANCELADA'],
  chamado: ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO'], prioridade: ['BAIXA', 'MEDIA', 'ALTA'],
};
module.exports = { AppError, fail, text, email, password, id, money, date, month, choice, patch, statuses };
