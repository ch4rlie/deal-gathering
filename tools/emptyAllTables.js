const createConnection = require("../utils/mysql");

const truncateTables = async () => {
  const connection = await createConnection();

  try {
    // Disable foreign key checks
    await connection.query(`SET FOREIGN_KEY_CHECKS = 0;`);

    // List of tables to truncate
    const tables = ["deals", "items__features", "items"];

    // Truncate each table separately
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table};`);
    }

    // Re-enable foreign key checks
    await connection.query(`SET FOREIGN_KEY_CHECKS = 1;`);

    console.log("Tables truncated successfully");
  } catch (error) {
    console.error("Error executing script:", error);
  } finally {
    await connection.end();
  }
};

truncateTables();
