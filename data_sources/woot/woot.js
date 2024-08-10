const path = require("path");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env.local"),
});

const axios = require("axios");
const mysql = require("mysql2/promise");
const fs = require("fs");
const {
  formatDateForMySQL,
  downloadImage,
  fetchOfferDetails,
} = require("./helper");

const processBrand = require("./processBrand");
const processCategories = require("./processCategories");

const fetchWootDeals = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  let page = 1;
  let hasMorePages = true;
  const maxDeals = 5; // Limit for testing
  let newDealsAdded = 0;

  try {
    while (hasMorePages && newDealsAdded < maxDeals) {
      console.log(`Fetching page: ${page}`); // Log the current page
      const response = await axios.get(
        `https://developer.woot.com/feed/All?page=${page}`,
        {
          headers: {
            "x-api-key": process.env.WOOT_API_KEY,
          },
        }
      );

      const deals = response.data.Items;

      if (deals.length === 0) {
        hasMorePages = false;
        break;
      }

      for (const deal of deals) {
        // Check if the deal already exists in the database
        const [existingDeal] = await connection.query(
          `SELECT id FROM deals WHERE woot_offer_id = ? LIMIT 1`,
          [deal.OfferId]
        );

        if (existingDeal.length > 0) {
          console.log(`Deal ${deal.OfferId} already exists. Skipping.`);
          continue; // Skip this deal if it already exists
        }

        // Fetch detailed offer information
        const offerDetails = await fetchOfferDetails(deal.OfferId);
        const itemDetails = offerDetails.Items[0]; // Assuming one item per offer

        // Save image locally
        const imageFilePath = path.resolve(
          __dirname,
          `./images/${itemDetails.Id}.jpg`
        );
        await downloadImage(itemDetails.Photos[0].Url, imageFilePath);
        console.log("Image downloaded:", imageFilePath);

        const itemSql = `
          INSERT INTO items (woot_item_id, title, description, \`condition\`, image_url, woot_url, woot_start_date, woot_end_date, asin, color, features, specs)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            title = VALUES(title),
            description = VALUES(description),
            \`condition\` = VALUES(\`condition\`),
            image_url = VALUES(image_url),
            woot_url = VALUES(woot_url),
            woot_start_date = VALUES(woot_start_date),
            woot_end_date = VALUES(woot_end_date),
            asin = VALUES(asin),
            color = VALUES(color),
            features = VALUES(features),
            specs = VALUES(specs)
        `;

        const itemValues = [
          offerDetails.Id,
          offerDetails.Title,
          offerDetails.Subtitle || null,
          itemDetails.Attributes.find((attr) => attr.Key === "Condition")
            ?.Value || null,
          `images/${itemDetails.Id}.jpg`,
          offerDetails.Url,
          formatDateForMySQL(offerDetails.StartDate),
          formatDateForMySQL(offerDetails.EndDate),
          itemDetails.Asin,
          itemDetails.Attributes.find((attr) => attr.Key === "Color")?.Value ||
            null,
          offerDetails.Features || null,
          offerDetails.Specs || null,
        ];

        await connection.query(itemSql, itemValues);
        console.log("Item inserted/updated:", offerDetails.Title);

        // Get the item ID
        const [itemRows] = await connection.query(
          `SELECT id FROM items WHERE woot_item_id = ? LIMIT 1`,
          [offerDetails.Id]
        );
        const itemId = itemRows[0].id;

        // Process brand and link to item
        if (offerDetails.BrandName) {
          console.log("Processing brand:", offerDetails.BrandName);
          const brandId = await processBrand(
            connection,
            offerDetails.BrandName
          );
          const brandLinkSql = `
            INSERT INTO items__brands (id_items, id_brands)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id_brands = VALUES(id_brands)
          `;
          await connection.query(brandLinkSql, [itemId, brandId]);
        } else {
          console.log("No BrandName found for deal:", offerDetails.Title);
        }

        // Ensure categories exist before processing
        console.log("Categories for deal:", deal.Categories); // Added log to check categories
        if (deal.Categories && deal.Categories.length > 0) {
          await processCategories(connection, deal.Categories, itemId);
        } else {
          console.log("No categories found for deal:", offerDetails.Title);
        }

        // Insert the deal
        const dealSql = `
        INSERT INTO deals (woot_offer_id, id, timestamp_inserted, status, price_expected, price_discounted, timestamp_expires)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          status = VALUES(status),
          price_expected = VALUES(price_expected),
          price_discounted = VALUES(price_discounted),
          timestamp_expires = VALUES(timestamp_expires)
      `;
        const dealValues = [
          offerDetails.Id,
          itemId, // assuming itemId corresponds to the correct ID column in the 'deals' table
          formatDateForMySQL(offerDetails.StartDate),
          offerDetails.IsSoldOut ? "sold out" : "live",
          itemDetails.ListPrice || itemDetails.SalePrice,
          itemDetails.SalePrice,
          formatDateForMySQL(offerDetails.EndDate),
        ];
        await connection.query(dealSql, dealValues);
        console.log("Deal inserted/updated:", offerDetails.Title);

        newDealsAdded++;
      }

      page += 1;
    }
  } catch (error) {
    console.error("Error fetching deals from Woot API:", error);
  } finally {
    await connection.end();
  }
};

fetchWootDeals();
