const { ipcRenderer } = require('electron');

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

ipcRenderer.on('login-success-admin', (event, userData) => {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  ipcRenderer.send('get-all-users');
  ipcRenderer.send('get-all-server-statuses');
});

function updateUserList(users, statuses) {
    const userListTableBody = document.getElementById('user-list-table').getElementsByTagName('tbody')[0];
    userListTableBody.innerHTML = ''; // Clear existing rows
    users.forEach(user => {
        let row = userListTableBody.insertRow();
        row.insertCell(0).textContent = user.id;
        row.insertCell(1).textContent = user.username;
        row.insertCell(2).textContent = user.role;
        row.insertCell(3).textContent = user.emby_port || 'N/A';

        let expirationDate = user.access_expires_at ? new Date(user.access_expires_at).toLocaleDateString('de-DE') : 'Unbegrenzt';
        row.insertCell(4).textContent = expirationDate;

        row.insertCell(5).textContent = statuses[user.username] || 'Gestoppt';

        let serverActionsCell = row.insertCell(6);
        if (user.role !== 'admin') {
            let restartButton = document.createElement('button');
            restartButton.textContent = 'Neustarten';
            restartButton.addEventListener('click', () => {
                ipcRenderer.send('admin-restart-emby', user.username);
            });
            serverActionsCell.appendChild(restartButton);
        }

        let userActionsCell = row.insertCell(7);
        if (user.role !== 'admin') {
            let deleteButton = document.createElement('button');
            deleteButton.textContent = 'Löschen';
            deleteButton.addEventListener('click', () => {
                if (confirm(`Sind Sie sicher, dass Sie den Benutzer "${user.username}" löschen möchten?`)) {
                    ipcRenderer.send('delete-user', user.id);
                }
            });
            userActionsCell.appendChild(deleteButton);
        }
    });
}

let currentUsers = [];
let currentStatuses = {};

ipcRenderer.on('all-users-data', (event, users) => {
  currentUsers = users;
  updateUserList(currentUsers, currentStatuses);
});

ipcRenderer.on('all-server-statuses-data', (event, statuses) => {
    currentStatuses = statuses;
    updateUserList(currentUsers, currentStatuses);
});

document.getElementById('createUserForm').addEventListener('submit', (evt) => {
    evt.preventDefault();
    const username = evt.target.username.value;
    const password = evt.target.password.value;
    const duration = evt.target.duration.value;
    ipcRenderer.send('create-user', { username, password, duration });
    evt.target.reset(); // Clear form
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

ipcRenderer.on('emby-status-changed', (event, status) => {
  document.getElementById('emby-status').textContent = status;
});
