const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const createConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: "utf8mb4",
    });

    console.log("Connected to the database.");
    return connection;
  } catch (err) {
    console.error("Error connecting to the database:", err.stack);
    throw err;
  }
};

module.exports = createConnection;
