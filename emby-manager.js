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

let embyProcess = null;

function startEmby(username, port) {
  const userDataPath = path.join(__dirname, 'data', username);
  const embyExecutable = getEmbyExecutable();
  embyProcess = spawn(embyExecutable, [`-programdata`, `"${userDataPath}"`, `-port`, port]);

  embyProcess.stdout.on('data', (data) => {
    console.log(`Emby stdout: ${data}`);
  });

  embyProcess.stderr.on('data', (data) => {
    console.error(`Emby stderr: ${data}`);
  });
}

function stopEmby() {
  if (embyProcess) {
    embyProcess.kill();
    embyProcess = null;
  }
}

function restartEmby(username, port) {
  stopEmby();
  startEmby(username, port);
}

function getEmbyExecutable() {
  const platform = getOS();
  if (platform === 'win32') {
    return path.join(__dirname, 'emby-server-windows-x64-4.7.6.0.exe');
  } else if (platform === 'darwin') {
    return path.join(__dirname, 'EmbyServer.app/Contents/MacOS/EmbyServer');
  }
  throw new Error('Unsupported platform');
}

module.exports = {
  getOS,
  downloadEmby,
  createEmbyInstance,
  startEmby,
  stopEmby,
  restartEmby
};
