'use strict';
const loginForm = document.querySelector('#login-form');
const errorMessage = document.querySelector('#login-error');
const submitButton = document.querySelector('#login-button');
loginForm.addEventListener('submit', async event => {
  event.preventDefault(); errorMessage.hidden = true; submitButton.disabled = true; submitButton.textContent = 'Entrando...';
  try { await window.connectnet.request('/auth/login', { method: 'POST', body: { email: loginForm.email.value, senha: loginForm.senha.value } }); location.replace('/index.html'); }
  catch (error) { errorMessage.textContent = error.message; errorMessage.hidden = false; }
  finally { submitButton.disabled = false; submitButton.textContent = 'Entrar no sistema'; }
});
document.querySelectorAll('[data-email]').forEach(button => button.addEventListener('click', () => { loginForm.email.value = button.dataset.email; loginForm.senha.value = 'ConnectNet#2026'; loginForm.email.focus(); }));
window.connectnet.request('/saude').then(data => { document.querySelector('#demo-accounts').hidden = data.modo !== 'demo'; }).catch(() => {});
