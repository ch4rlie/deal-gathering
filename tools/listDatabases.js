const mysql = require("mysql2");

require("dotenv").config({ path: require("path").resolve(__dirname, '../.env.local') });
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.stack);
    return;
  }
  console.log("Connected to MySQL");

  connection.query("SHOW DATABASES", (error, results) => {
    if (error) throw error;

    console.log("Databases:");
    results.forEach((db) => {
      console.log(`- ${db.Database}`);
    });

    connection.end();
  });
});
