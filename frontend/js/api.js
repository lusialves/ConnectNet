'use strict';
window.connectnet = {
  csrf: null,
  async download(path, filename) {
    let response;
    try { response = await fetch(`/api/v1${path}`, { credentials: 'same-origin' }); }
    catch { throw new Error('Não foi possível conectar ao servidor.'); }
    if (!response.ok) {
      let message = 'Não foi possível exportar os registros.';
      try { message = (await response.json()).erro?.mensagem || message; } catch {}
      const error = new Error(message); error.status = response.status; throw error;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    // Retira o recurso após a navegação iniciar, para preservar downloads lentos.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
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
