const os = require('os');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const embyUrls = {
  win32: 'https://github.com/MediaBrowser/Emby.Releases/releases/download/4.7.6.0/emby-server-windows-x64-4.7.6.0.exe',
  darwin: 'https://github.com/MediaBrowser/Emby.Releases/releases/download/4.7.6.0/emby-server-mac-x64-4.7.6.0.pkg'
};

function getOS() {
  return os.platform();
}

async function downloadEmby() {
  const platform = getOS();
  const url = embyUrls[platform];
  if (!url) {
    throw new Error('Unsupported platform');
  }

  const fileName = path.basename(url);
  const filePath = path.join(__dirname, fileName);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

function createEmbyInstance(username, port) {
  const userDataPath = path.join(__dirname, 'data', username);
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
}

const { spawn } = require('child_process');

const runningProcesses = new Map();

function startEmby(username, port) {
  if (runningProcesses.has(username)) {
    console.log(`Emby-Server für ${username} läuft bereits.`);
    return;
  }

  const userDataPath = path.join(__dirname, 'data', username);
  const embyExecutable = getEmbyExecutable();
  const embyProcess = spawn(embyExecutable, [`-programdata`, `"${userDataPath}"`, `-port`, port]);

  embyProcess.stdout.on('data', (data) => {
    console.log(`Emby stdout (${username}): ${data}`);
  });

  embyProcess.stderr.on('data', (data) => {
    console.error(`Emby stderr (${username}): ${data}`);
  });

  embyProcess.on('close', () => {
    runningProcesses.delete(username);
    console.log(`Emby-Server für ${username} wurde beendet.`);
  });

  runningProcesses.set(username, embyProcess);
  console.log(`Emby-Server für ${username} gestartet.`);
}

function stopEmby(username) {
  if (runningProcesses.has(username)) {
    runningProcesses.get(username).kill();
    runningProcesses.delete(username);
    console.log(`Emby-Server für ${username} wird gestoppt.`);
  }
}

function restartEmby(username, port) {
  stopEmby(username);
  // Kurze Verzögerung, um sicherzustellen, dass der Port freigegeben ist
  setTimeout(() => startEmby(username, port), 1000);
}

function getServerStatus(username) {
    return runningProcesses.has(username) ? 'Läuft' : 'Gestoppt';
}

function getAllServerStatuses() {
    const statuses = {};
    const allUsers = require('./database.js').getAllUsers();
    allUsers.forEach(user => {
        statuses[user.username] = getServerStatus(user.username);
    });
    return statuses;
}

function getEmbyExecutable() {
  const platform = getOS();
  if (platform === 'win32') {
    return path.join(__dirname, 'emby-server-windows-x64-4.7.6.0.exe');
  } else if (platform === 'darwin') {
    return path.join(__dirname, 'EmbyServer.app/Contents/MacOS/EmbyServer');
  }
  throw new Error('Nicht unterstützte Plattform');
}

module.exports = {
  getOS,
  downloadEmby,
  createEmbyInstance,
  startEmby,
  stopEmby,
  restartEmby,
  getServerStatus,
  getAllServerStatuses
};
