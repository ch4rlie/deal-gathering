const axios = require("axios");
const fs = require("fs");

const formatDateForMySQL = (isoString) => {
  if (!isoString) {
    return "0000-00-00 00:00:00";
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${isoString}`);
    return "0000-00-00 00:00:00";
  }
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const downloadImage = async (url, filepath) => {
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

const fetchOfferDetails = async (offerId) => {
  try {
    const response = await axios.get(
      `https://developer.woot.com/offers/${offerId}`,
      {
        headers: {
          "x-api-key": process.env.WOOT_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching offer details for ${offerId}:`, error);
    throw error;
  }
};

module.exports = {
  formatDateForMySQL,
  downloadImage,
  fetchOfferDetails,
};
