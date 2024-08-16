const createConnection = require("../utils/mysql");

const truncateTables = async () => {
  const connection = await createConnection();

  try {
    const query = `
      SET FOREIGN_KEY_CHECKS = 0;

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
      TRUNCATE 
      TABLE comments;
      TRUNCATE TABLE users__deals;

      SET FOREIGN_KEY_CHECKS = 1;
    `;

    await connection.query(query);
    console.log("Tables truncated successfully");
  } catch (error) {
    console.error("Error executing script:", error);
  } finally {
    await connection.end();
  }
};

truncateTables();
