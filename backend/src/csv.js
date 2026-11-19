'use strict';
// CSV em UTF-8 com BOM e separador compatível com planilhas em pt-BR.
// Prefixo em fórmulas impede a execução de conteúdo informado por usuários.
function cell(value) {
  let text = String(value ?? '').replace(/\r\n?/g, '\n');
  if (/^[\s]*[=+@\-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
function invoicesCsv(invoices) {
  const header = ['ID', 'Cliente', 'Competência', 'Valor (R$)', 'Emissão', 'Vencimento', 'Situação'];
  const records = invoices.map(row => [row.id, row.cliente_nome, row.competencia,
    Number(row.valor).toFixed(2).replace('.', ','), row.data_emissao, row.data_vencimento, row.status]);
  return '\uFEFF' + [header, ...records].map(row => row.map(cell).join(';')).join('\r\n') + '\r\n';
}
module.exports = { invoicesCsv };
