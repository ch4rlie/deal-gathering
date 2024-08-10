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
    const query = `SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE deals__brands;
TRUNCATE TABLE deals__categories;
TRUNCATE TABLE brands;
TRUNCATE TABLE categories;
TRUNCATE TABLE deals;
TRUNCATE TABLE steps;
TRUNCATE TABLE users;
TRUNCATE TABLE notifications;
TRUNCATE TABLE items__features;
TRUNCATE TABLE items;
TRUNCATE TABLE forum_posts;
TRUNCATE TABLE features;
TRUNCATE TABLE deals__steps;
TRUNCATE TABLE comment_reports;
TRUNCATE TABLE comments;
TRUNCATE TABLE users__deals;

SET FOREIGN_KEY_CHECKS = 1;

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
