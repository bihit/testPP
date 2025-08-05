const { app, BrowserWindow, ipcMain } = require('electron')
const db = require('./database.js')

function createWindow () {
  const win = new BrowserWindow({
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

ipcMain.on('create-user', (event, args) => {
  const embyPort = nextPort++;
  db.addUser(args.username, args.password, embyPort, (err, userId) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`User created with ID: ${userId}`);
      embyManager.createEmbyInstance(args.username, embyPort);
    }
  });
});

ipcMain.on('login-user', (event, args) => {
  db.getUser(args.username, (err, user) => {
    if (err) {
      console.error(err);
    } else if (user && user.password === args.password) {
      currentUser = user;
      event.sender.send('login-success', user);
    } else {
      console.log('Invalid username or password');
    }
  });
});

ipcMain.on('start-emby', () => {
  if (currentUser) {
    embyManager.startEmby(currentUser.username, currentUser.emby_port);
  }
});

ipcMain.on('stop-emby', () => {
  if (currentUser) {
    embyManager.stopEmby(currentUser.username);
  }
});

ipcMain.on('restart-emby', () => {
  if (currentUser) {
    embyManager.restartEmby(currentUser.username, currentUser.emby_port);
  }
});
