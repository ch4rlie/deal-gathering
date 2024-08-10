const fs = require("fs");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE, // Ensure this is set in your .env.local file
});

const fetchSchema = async () => {
  try {
    const [tables] = await connection.promise().query("SHOW TABLES");
    const databaseName = process.env.MYSQL_DATABASE;
    let schema = `Database: ${databaseName}\n\n`;

    for (const tableObj of tables) {
      const tableName = tableObj[`Tables_in_${databaseName}`];
      schema += `Table: ${tableName}\n`;

      const [columns] = await connection
        .promise()
        .query(`SHOW COLUMNS FROM ${tableName}`);
      columns.forEach((column) => {
        schema += `  - ${column.Field} (${column.Type})\n`;
      });

      schema += "\n";
    }

    // Save the schema to a local file within the tools folder
    fs.writeFileSync("database_schema.txt", schema);
    console.log("Schema saved to tools/database_schema.txt");
  } catch (error) {
    console.error("Error fetching schema:", error);
  } finally {
    connection.end();
  }
};

fetchSchema();
