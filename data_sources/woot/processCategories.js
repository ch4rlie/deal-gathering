const processCategories = async (connection, categories, itemId) => {
  if (!categories || categories.length === 0) {
    console.log("No categories provided.");
    return;
  }

  for (const category of categories) {
    console.log(`Processing category: ${category}`);

    // Check if the category already exists in the database
    const [categoryRows] = await connection.query(
      `SELECT id FROM categories WHERE label = ? LIMIT 1`,
      [category]
    );

    let categoryId;
    if (categoryRows.length > 0) {
      categoryId = categoryRows[0].id;
      console.log(`Category found in DB: ${category} (ID: ${categoryId})`);
    } else {
      // Insert the new category if it does not exist
      const [result] = await connection.query(
        `INSERT INTO categories (label) VALUES (?)`,
        [category]
      );
      categoryId = result.insertId;
      console.log(`Inserted new category: ${category} (ID: ${categoryId})`);
    }

    // Check if the category is already linked to the item
    const [existingLink] = await connection.query(
      `SELECT * FROM deals__categories WHERE id_deals = ? AND id_categories = ? LIMIT 1`,
      [itemId, categoryId]
    );

    if (existingLink.length === 0) {
      // Link the category to the item
      const linkSql = `
        INSERT INTO deals__categories (id_deals, id_categories)
        VALUES (?, ?)
      `;
      await connection.query(linkSql, [itemId, categoryId]);
      console.log(`Linked item ${itemId} to category ${categoryId}`);
    } else {
      console.log(`Item ${itemId} already linked to category ${categoryId}`);
    }
  }
};

module.exports = processCategories;
