const fs = require('fs');
const dbPath = './database.db';

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = require('better-sqlite3')(dbPath);

db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, emby_port INTEGER, role TEXT, access_expires_at TEXT)");

const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('standard');
if (!admin) {
  // Admins should not expire
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('standard', 'standard', 'admin');
  console.log("Admin-Benutzer erstellt: standard / standard");
}

function addUser(username, password, embyPort, accessExpiresAt) {
  const stmt = db.prepare("INSERT INTO users (username, password, emby_port, access_expires_at) VALUES (?, ?, ?, ?)");
  const info = stmt.run(username, password, embyPort, accessExpiresAt);
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

function getAllUsers() {
  return db.prepare("SELECT id, username, role, emby_port FROM users").all();
}

module.exports = {
  addUser,
  getUser,
  deleteUser,
  getAllUsers
};
