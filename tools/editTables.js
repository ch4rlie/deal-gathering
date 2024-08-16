const createConnection = require("../utils/mysql");

const runSQLOnDatabase = async () => {
  const connection = await createConnection(); // Using the helper function to create the connection

  try {
    const query = `
      ALTER TABLE items MODIFY COLUMN features TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      ALTER TABLE items MODIFY COLUMN title VARCHAR(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      ALTER TABLE items MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `;

    await connection.query(query);
    console.log("Command ran successfully");
  } catch (error) {
    console.error("Error executing script:", error);
  } finally {
    await connection.end();
  }
};

runSQLOnDatabase();
