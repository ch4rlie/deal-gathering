const fs = require("fs");
const path = require("path");
const createConnection = require("../utils/mysql");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env.local"),
});

const fetchSchema = async () => {
  const connection = await createConnection(); // Establishes the connection

  try {
    const [tables] = await connection.query("SHOW TABLES");
    const databaseName = process.env.DB_NAME;
    let schema = `Database: ${databaseName}\n\n`;

    for (const tableObj of tables) {
      const tableName = tableObj[`Tables_in_${databaseName}`];
      schema += `Table: ${tableName}\n`;

      const [columns] = await connection.query(
        `SHOW COLUMNS FROM ${tableName}`
      );
      columns.forEach((column) => {
        schema += `  - ${column.Field} (${column.Type})\n`;
      });

      schema += "\n";
    }

    // Save the schema to a local file within the tools folder
    fs.writeFileSync("tools/database_schema.txt", schema);
    console.log("Schema saved to tools/database_schema.txt");
  } catch (error) {
    console.error("Error fetching schema:", error);
  } finally {
    await connection.end(); // Properly closes the connection
  }
};

fetchSchema();
