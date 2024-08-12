const mysql = require("mysql2");
const path = require("path");

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});
// MySQL connection setup
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: true,
});

const addWootOfferIdColumn = async () => {
  try {
    const query = `
ALTER TABLE items MODIFY COLUMN features TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE items MODIFY COLUMN title VARCHAR(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE items MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

`;
    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error:", err.stack);
      } else {
        console.log("Command ran successuflly: ", results);
      }
    });
  } catch (error) {
    console.error("Error executing script:", error);
  } finally {
    connection.end();
  }
};

addWootOfferIdColumn();
