const mysql = require("mysql2");
const fs = require("fs");
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
});

const generateDealsReport = async () => {
  try {
    const [rows] = await connection.promise().query(`
      SELECT d.id, d.timestamp_inserted, d.status, d.price_expected, d.price_discounted, d.timestamp_expires,
             i.title AS item_title, i.description, i.condition, i.woot_url, i.woot_start_date, i.woot_end_date, i.color,
             GROUP_CONCAT(DISTINCT c.label ORDER BY c.label ASC) AS categories,
             b.label AS brand
      FROM deals d
      LEFT JOIN items i ON d.id = i.id
      LEFT JOIN deals__categories dc ON d.id = dc.id_deals
      LEFT JOIN categories c ON dc.id_categories = c.id
      LEFT JOIN deals__brands db ON d.id = db.id_deals
      LEFT JOIN brands b ON db.id_brands = b.id
      GROUP BY d.id, b.label, i.title, i.description, i.condition, i.woot_url, i.woot_start_date, i.woot_end_date, i.color
      ORDER BY d.timestamp_inserted DESC
    `);

    let htmlContent = `
      <html>
      <head>
        <title>Deals Report</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          img { max-width: 100px; max-height: 100px; }
        </style>
      </head>
      <body>
        <h1>Deals Report</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Inserted</th>
              <th>Status</th>
              <th>Expected Price</th>
              <th>Discounted Price</th>
              <th>Expires</th>
              <th>Item Title</th>
              <th>Description</th>
              <th>Condition</th>
              <th>Color</th>
              <th>Categories</th>
              <th>Brand</th>
              <th>Image</th>
              <th>Woot URL</th>
            </tr>
          </thead>
          <tbody>
    `;

    rows.forEach((row) => {
      const priceExpected = row.price_expected
        ? `$${parseFloat(row.price_expected).toFixed(2)}`
        : "N/A";
      const priceDiscounted = row.price_discounted
        ? `$${parseFloat(row.price_discounted).toFixed(2)}`
        : "N/A";
      const imageUrl = row.image_url
        ? `<img src="${row.image_url}" alt="Deal Image">`
        : "No Image";

      htmlContent += `
        <tr>
          <td>${row.id}</td>
          <td>${new Date(row.timestamp_inserted).toLocaleString()}</td>
          <td>${row.status}</td>
          <td>${priceExpected}</td>
          <td>${priceDiscounted}</td>
          <td>${new Date(row.timestamp_expires).toLocaleString()}</td>
          <td>${row.item_title}</td>
          <td>${row.description || "N/A"}</td>
          <td>${row.condition || "N/A"}</td>
          <td>${row.color || "N/A"}</td>
          <td>${row.categories || "N/A"}</td>
          <td>${row.brand || "N/A"}</td>
          <td>${imageUrl}</td>
          <td><a href="${row.woot_url}" target="_blank">View on Woot</a></td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    fs.writeFileSync("deals_report.html", htmlContent);
    console.log("Deals report generated: deals_report.html");
  } catch (error) {
    console.error("Error generating deals report:", error);
  } finally {
    connection.end();
  }
};

generateDealsReport();
