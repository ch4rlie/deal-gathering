const axios = require("axios");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });

const WOOT_FEED_ENDPOINT = "https://developer.woot.com/feed/All";
const WOOT_GET_OFFERS_ENDPOINT = "https://developer.woot.com/getoffers";

const { formatDateForMySQL, downloadImage } = require("./helper");
const processBrand = require("./processBrand");
const processCategories = require("./processCategories");

const fetchWootDeals = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: "utf8mb4",
  });

  let page = 1;
  let maxDeals = 25; // Limit for testing
  let newDealsAdded = 0;
  let hasMorePages = true;
  const offerIdsBatch = [];

  try {
    while (hasMorePages && newDealsAdded < maxDeals) {
      console.log(`Fetching page: ${page}`);
      const response = await axios.get(`${WOOT_FEED_ENDPOINT}?page=${page}`, {
        headers: {
          "x-api-key": process.env.WOOT_API_KEY,
        },
      });

      const deals = response.data.Items;

      if (deals.length === 0) {
        hasMorePages = false;
        break;
      }

      // Collect offer IDs
      for (const deal of deals) {
        offerIdsBatch.push(deal.OfferId);
        if (offerIdsBatch.length === 25) {
          await fetchOfferDetailsBatch(offerIdsBatch, connection);
          offerIdsBatch.length = 0; // Clear the batch after processing
          newDealsAdded += 25;
          if (newDealsAdded >= maxDeals) break;
        }
      }

      // Handle any remaining offer IDs
      if (offerIdsBatch.length > 0) {
        await fetchOfferDetailsBatch(offerIdsBatch, connection);
        newDealsAdded += offerIdsBatch.length;
        offerIdsBatch.length = 0; // Clear the batch after processing
      }

      page += 1;
    }
  } catch (error) {
    console.error(
      "Error fetching deals from Woot API:",
      error.response?.data || error.message
    );
  } finally {
    await connection.end();
  }
};

const fetchOfferDetailsBatch = async (offerIds, connection) => {
  try {
    const response = await axios.post(
      WOOT_GET_OFFERS_ENDPOINT,
      offerIds, // Pass the offerIds array here
      {
        headers: {
          "x-api-key": process.env.WOOT_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const offers = response.data;

    for (const offer of offers) {
      // Process each offer as before
      const itemDetails = offer.Items[0]; // Assuming one item per offer

      // Save image(s) locally
      const imagePaths = [];
      for (const photo of itemDetails.Photos) {
        const imageFilePath = path.resolve(
          __dirname,
          `./images/${itemDetails.Id}_${photo.Id}.jpg`
        );
        await downloadImage(photo.Url, imageFilePath);
        imagePaths.push(`images/${itemDetails.Id}_${photo.Id}.jpg`);
      }

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
        itemDetails.Id,
        offer.FullTitle,
        offer.WriteupBody || null,
        itemDetails.Attributes.find((attr) => attr.Key === "Condition")
          ?.Value || null,
        JSON.stringify(imagePaths),
        offer.Url,
        formatDateForMySQL(offer.StartDate),
        formatDateForMySQL(offer.EndDate),
        itemDetails.Asin,
        itemDetails.Attributes.find((attr) => attr.Key === "Color")?.Value ||
          null,
        offer.Features || null,
        offer.Specs || null,
      ];

      await connection.query(itemSql, itemValues);
      console.log("Item inserted/updated:", offer.FullTitle);

      // Get the item ID
      const [itemRows] = await connection.query(
        `SELECT id FROM items WHERE woot_item_id = ? LIMIT 1`,
        [itemDetails.Id]
      );
      const itemId = itemRows[0].id;

      // Process brand and link to item
      if (offer.BrandName) {
        console.log("Processing brand:", offer.BrandName);
        const brandId = await processBrand(connection, offer.BrandName);
        const brandLinkSql = `INSERT INTO items__brands (id_items, id_brands) VALUES (?, ?) ON DUPLICATE KEY UPDATE id_brands = VALUES(id_brands)`;
        await connection.query(brandLinkSql, [itemId, brandId]);
      } else {
        console.log("No BrandName found for deal:", offer.FullTitle);
      }

      // Process categories and link to deal
      await processCategories(connection, offer.Categories, itemId);

      // Insert the deal
      const dealSql = `
            INSERT INTO deals (woot_offer_id, id_items, timestamp_inserted, status, price_expected, price_discounted, timestamp_expires)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              status = VALUES(status),
              price_expected = VALUES(price_expected),
              price_discounted = VALUES(price_discounted),
              timestamp_expires = VALUES(timestamp_expires)
          `;
      const dealValues = [
        offer.OfferId,
        itemId,
        formatDateForMySQL(offer.StartDate),
        offer.IsSoldOut ? "sold out" : "live",
        itemDetails.ListPrice || itemDetails.SalePrice,
        itemDetails.SalePrice,
        formatDateForMySQL(offer.EndDate),
      ];
      await connection.query(dealSql, dealValues);
      console.log("Deal inserted/updated:", offer.FullTitle);
    }
  } catch (error) {
    console.error(
      "Error fetching offer details from Woot API:",
      error.response?.data || error.message
    );
  }
};

fetchWootDeals();
