const mysql = require("mysql2/promise");

const processBrand = async (connection, brandName) => {
  try {
    // Insert the brand into the brands table if it doesn't exist
    const brandSql = `
      INSERT INTO brands (label) VALUES (?)
      ON DUPLICATE KEY UPDATE label = VALUES(label)
    `;
    const [insertResult] = await connection.query(brandSql, [brandName]);
    console.log(
      `Brand inserted/updated: ${brandName}, Affected Rows: ${insertResult.affectedRows}`
    );

    // Get the brand ID
    const [rows] = await connection.query(
      `SELECT id FROM brands WHERE label = ? LIMIT 1`,
      [brandName]
    );

    if (rows.length > 0) {
      return rows[0].id;
    } else {
      console.error("No rows found when trying to retrieve brand ID");
      throw new Error("Failed to retrieve brand ID");
    }
  } catch (error) {
    console.error("Error processing brand:", error);
    throw error;
  }
};

module.exports = processBrand;
