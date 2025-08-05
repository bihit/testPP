const sqlite3 = require('sqlite3').verbose();
let db;

function initDb(callback) {
  db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
  });

  db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, emby_port INTEGER, role TEXT)", (err) => {
        if (err) {
            console.error(err.message);
        }
        db.get("SELECT * FROM users WHERE username = ?", ["admin"], (err, row) => {
            if (!row) {
                db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", "admin123", "admin"], (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                    console.log("Admin user created: admin / admin123");
                    callback();
                });
            } else {
                callback();
            }
        });
    });
  });
}


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
  initDb,
  addUser,
  getUser,
  deleteUser
};
