'use strict';
window.connectnet = {
  csrf: null,
  async request(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(this.csrf && method !== 'GET' ? { 'X-CSRF-Token': this.csrf } : {}), ...options.headers };
    let response;
    try { response = await fetch(`/api/v1${path}`, { ...options, method, headers, credentials: 'same-origin', body: options.body ? JSON.stringify(options.body) : undefined }); }
    catch { throw new Error('Não foi possível conectar ao servidor. Verifique se o ConnectNet está em execução.'); }
    if (response.status === 204) return null;
    const result = await response.json();
    if (!response.ok) { const error = new Error(result.erro?.mensagem || 'A operação não foi concluída.'); error.status = response.status; throw error; }
    if (result.dados?.csrfToken) this.csrf = result.dados.csrfToken;
    return result.dados;
  },
};
