const { app, BrowserWindow, ipcMain } = require('electron')
const db = require('./database.js')

let win;

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const embyManager = require('./emby-manager.js');

let nextPort = 8096;

let currentUser = null;

ipcMain.on('login-user', (event, args) => {
  const user = db.getUser(args.username);
  if (user && user.password === args.password) {
    // Check for expiration, but allow admin to always log in
    if (user.role !== 'admin' && user.access_expires_at && new Date(user.access_expires_at) < new Date()) {
      console.log(`Benutzerkonto für ${user.username} ist abgelaufen.`);
      return;
    }

    currentUser = user;
    if (user.role === 'admin') {
      event.sender.send('login-success-admin', user);
    } else {
      event.sender.send('login-success', user);
    }
  } else {
    console.log('Ungültiger Benutzername oder ungültiges Passwort');
  }
});

ipcMain.on('get-all-users', (event) => {
  const users = db.getAllUsers();
  event.sender.send('all-users-data', users);
});

ipcMain.on('create-user', (event, args) => {
  const { username, password, duration } = args;
  const embyPort = nextPort++;

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + parseInt(duration, 10));

  db.addUser(username, password, embyPort, expirationDate.toISOString());
  embyManager.createEmbyInstance(username, embyPort);

  const users = db.getAllUsers();
  event.sender.send('all-users-data', users);
});

ipcMain.on('delete-user', (event, userId) => {
  // Note: In a real app, we should verify that the sender is an admin.
  const userToDelete = db.getAllUsers().find(u => u.id === userId);
  if (userToDelete) {
    db.deleteUser(userToDelete.username);
    // In a real app, you might want to clean up the user's data directory as well.
  }
  // Refresh user list
  const users = db.getAllUsers();
  event.sender.send('all-users-data', users);
});

ipcMain.on('start-emby', () => {
  if (currentUser) {
    embyManager.startEmby(currentUser.username, currentUser.emby_port);
    win.webContents.send('emby-status-changed', 'Läuft');
  }
});

// Admin controls
ipcMain.on('admin-restart-emby', (event, username) => {
    const user = db.getAllUsers().find(u => u.username === username);
    if (user) {
        embyManager.restartEmby(user.username, user.emby_port);
    }
    // Notify to refresh statuses
    event.sender.send('all-server-statuses-data', embyManager.getAllServerStatuses());
});

ipcMain.on('get-all-server-statuses', (event) => {
    event.sender.send('all-server-statuses-data', embyManager.getAllServerStatuses());
});

ipcMain.on('stop-emby', () => {
  if (currentUser) {
    embyManager.stopEmby(currentUser.username);
    win.webContents.send('emby-status-changed', 'Gestoppt');
  }
});

ipcMain.on('restart-emby', () => {
  if (currentUser) {
    embyManager.restartEmby(currentUser.username, currentUser.emby_port);
    win.webContents.send('emby-status-changed', 'Läuft');
  }
});
