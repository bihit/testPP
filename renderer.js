const { ipcRenderer } = require('electron');

document.getElementById('createUserForm').addEventListener('submit', (evt) => {
  evt.preventDefault();
  const username = evt.target.username.value;
  const password = evt.target.password.value;
  ipcRenderer.send('create-user', { username, password });
});

document.getElementById('loginUserForm').addEventListener('submit', (evt) => {
  evt.preventDefault();
  const username = evt.target.username.value;
  const password = evt.target.password.value;
  ipcRenderer.send('login-user', { username, password });
});

ipcRenderer.on('login-success', (event, userData) => {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('user-dashboard').style.display = 'block';
  document.getElementById('username-display').textContent = userData.username;
});

document.getElementById('start-emby').addEventListener('click', () => {
  ipcRenderer.send('start-emby');
});

document.getElementById('stop-emby').addEventListener('click', () => {
  ipcRenderer.send('stop-emby');
});

document.getElementById('restart-emby').addEventListener('click', () => {
  ipcRenderer.send('restart-emby');
});
