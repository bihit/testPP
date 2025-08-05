const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, emby_port INTEGER)");
});

function addUser(username, password, embyPort, callback) {
  const stmt = db.prepare("INSERT INTO users (username, password, emby_port) VALUES (?, ?, ?)");
  stmt.run(username, password, embyPort, function(err) {
    callback(err, this.lastID);
  });
  stmt.finalize();
}

function getUser(username, callback) {
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    callback(err, row);
  });
}

function deleteUser(username, callback) {
  db.run("DELETE FROM users WHERE username = ?", [username], function(err) {
    callback(err, this.changes);
  });
}

module.exports = {
  addUser,
  getUser,
  deleteUser
};
