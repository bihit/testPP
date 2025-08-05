const fs = require('fs');
const dbPath = './database.db';

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = require('better-sqlite3')(dbPath);

db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, emby_port INTEGER, role TEXT)");

const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('standard');
if (!admin) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('standard', 'standard', 'admin');
  console.log("Admin user created: standard / standard");
}

function addUser(username, password, embyPort) {
  const stmt = db.prepare("INSERT INTO users (username, password, emby_port) VALUES (?, ?, ?)");
  const info = stmt.run(username, password, embyPort);
  return info.lastInsertRowid;
}

function getUser(username) {
  const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
  const user = stmt.get(username);
  return user;
}

function deleteUser(username) {
  const stmt = db.prepare("DELETE FROM users WHERE username = ?");
  const info = stmt.run(username);
  return info.changes;
}

module.exports = {
  addUser,
  getUser,
  deleteUser
};
