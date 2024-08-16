const createConnection = require("../utils/mysql");

(async () => {
  try {
    const connection = await createConnection();

    const [results] = await connection.query("SHOW DATABASES");

    console.log("Databases:");
    results.forEach((db) => {
      console.log(`- ${db.Database}`);
    });

    await connection.end();
  } catch (err) {
    console.error("Error connecting to MySQL:", err.stack);
  }
})();
