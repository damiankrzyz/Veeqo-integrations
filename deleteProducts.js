const axios = require('axios');

// Configure a retry delay in milliseconds (e.g., 1 minute)
const RETRY_DELAY = 60 * 1000;

// Function to delay a promise by a given amount of time
const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

async function deleteProducts() {
  try {
    const pageSize = 50;
    let page = 1;

    while (true) {
      // Fetch products from the API
      let response;
      try {
        response = await axios.get(`https://api.veeqo.com/products?page_size=${pageSize}&page=${page}`, {
          headers: {
            'x-api-key': 'replace-with-your-api-key'
          }
        });
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // If rate limited, wait for the retry delay and then continue
          console.error(`Rate limit exceeded. Waiting for ${RETRY_DELAY / 1000} seconds before retrying...`);
          await delay(RETRY_DELAY);
          continue;
        } else {
          throw error; // For other types of errors, throw them
        }
      }

      const products = response.data;
      if (products.length === 0) {
        break; // No more products to process
      }

      // Collect product IDs to delete
      const productIdsToDelete = products
        .filter((product) => product.sellables.some((sellable) => sellable.stock_entries[0].available_stock_level === 0))
        .map((product) => product.id);

      // Delete products with available_stock_level: 0
      for (const productId of productIdsToDelete) {
        try {
          await axios.delete(`https://api.veeqo.com/products/${productId}`, {
            headers: {
              'x-api-key': 'Vqt/02a4f9837525ece2cbbcc0419f2fb4da'
            }
          });
          console.log(`Deleted product with ID: ${productId}`);
        } catch (error) {
          console.error(`Failed to delete product with ID: ${productId}`, error.message);
        }
      }

      page++;
    }

    console.log('Finished deleting products with "available_stock_level": 0');
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

deleteProducts();
