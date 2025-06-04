// Comprehensive pricing APIs integration for real merchant price comparison
// This focuses specifically on pricing data from multiple retailers

interface MerchantPrice {
  merchant: string;
  price: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
  url?: string;
  shipping?: string;
  lastUpdated: Date;
}

interface PricingResponse {
  barcode: string;
  prices: MerchantPrice[];
  sources: string[];
  success: boolean;
  error?: string;
}

// Shopping.com API (now part of eBay) - Price comparison
export async function fetchShoppingComPrices(upc: string): Promise<MerchantPrice[]> {
  const apiKey = process.env.SHOPPING_API_KEY;
  
  if (!apiKey) {
    console.log("SHOPPING_API_KEY not configured");
    return [];
  }

  try {
    const response = await fetch(`https://api.shopping.com/publisher/3.0/rest/GeneralSearch?apiKey=${apiKey}&trackingId=7000610&categoryId=0&productIdType=UPC&productId=${upc}&numItems=20&enableDeepCategories=0&showProductSpecs=1&showProductReviews=1&showAttributes=1&showMerchantRatings=1`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Shopping API error: ${response.status}`);
    }

    const data = await response.json();
    const prices: MerchantPrice[] = [];

    if (data.products && data.products.product) {
      const products = Array.isArray(data.products.product) ? data.products.product : [data.products.product];
      
      for (const product of products) {
        if (product.offers && product.offers.offer) {
          const offers = Array.isArray(product.offers.offer) ? product.offers.offer : [product.offers.offer];
          
          for (const offer of offers) {
            prices.push({
              merchant: offer.merchant.name,
              price: parseFloat(offer.basePrice),
              currency: 'USD',
              availability: offer.stockStatus === 'in stock' ? 'in_stock' : 'unknown',
              url: offer.offerURL,
              shipping: offer.shippingCost ? `$${offer.shippingCost}` : undefined,
              lastUpdated: new Date()
            });
          }
        }
      }
    }

    return prices;
  } catch (error) {
    console.error(`Shopping API error: ${(error as Error).message}`);
    return [];
  }
}

// Google Shopping API (via Custom Search)
export async function fetchGoogleShoppingPrices(upc: string, productName?: string): Promise<MerchantPrice[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cxId = process.env.GOOGLE_SHOPPING_CX;
  
  if (!apiKey || !cxId) {
    console.log("Google Shopping API credentials not configured");
    return [];
  }

  try {
    const searchQuery = productName ? `${productName} ${upc}` : upc;
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cxId}&q=${encodeURIComponent(searchQuery)}&searchType=image&imgType=product`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Shopping API error: ${response.status}`);
    }

    const data = await response.json();
    const prices: MerchantPrice[] = [];

    // Google Shopping results would need additional parsing
    // This is a simplified implementation
    if (data.items) {
      for (const item of data.items.slice(0, 10)) {
        // Extract price information from snippets or structured data
        const priceMatch = item.snippet.match(/\$(\d+(?:\.\d{2})?)/);
        if (priceMatch) {
          prices.push({
            merchant: new URL(item.link).hostname.replace('www.', ''),
            price: parseFloat(priceMatch[1]),
            currency: 'USD',
            availability: 'unknown',
            url: item.link,
            lastUpdated: new Date()
          });
        }
      }
    }

    return prices;
  } catch (error) {
    console.error(`Google Shopping API error: ${(error as Error).message}`);
    return [];
  }
}

// PriceAPI.com - Multi-retailer price tracking
export async function fetchPriceApiPrices(upc: string): Promise<MerchantPrice[]> {
  const apiKey = process.env.PRICEAPI_KEY;
  
  if (!apiKey) {
    console.log("PRICEAPI_KEY not configured");
    return [];
  }

  try {
    const response = await fetch(`https://api.priceapi.com/v2/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'google_shopping',
        country: 'us',
        topic: 'product_and_offers',
        key: upc,
        max_pages: 3
      })
    });

    if (!response.ok) {
      throw new Error(`PriceAPI error: ${response.status}`);
    }

    const data = await response.json();
    const prices: MerchantPrice[] = [];

    // PriceAPI returns job ID, need to poll for results
    if (data.job_id) {
      // In a real implementation, you'd poll the results endpoint
      console.log(`PriceAPI job created: ${data.job_id}`);
    }

    return prices;
  } catch (error) {
    console.error(`PriceAPI error: ${(error as Error).message}`);
    return [];
  }
}

// Fake Spot API - Price tracking and alerts
export async function fetchFakeSpotPrices(upc: string): Promise<MerchantPrice[]> {
  const apiKey = process.env.FAKESPOT_API_KEY;
  
  if (!apiKey) {
    console.log("FAKESPOT_API_KEY not configured");
    return [];
  }

  try {
    // FakeSpot focuses more on review analysis but may have pricing data
    const response = await fetch(`https://api.fakespot.com/analyze?url=${encodeURIComponent(`https://www.amazon.com/s?k=${upc}`)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`FakeSpot API error: ${response.status}`);
    }

    // Implementation would depend on FakeSpot's actual API structure
    return [];
  } catch (error) {
    console.error(`FakeSpot API error: ${(error as Error).message}`);
    return [];
  }
}

// Keepa API - Amazon price tracking
export async function fetchKeepaAmazonPrices(upc: string): Promise<MerchantPrice[]> {
  const accessKey = process.env.KEEPA_API_KEY;
  
  if (!accessKey) {
    console.log("KEEPA_API_KEY not configured");
    return [];
  }

  try {
    const response = await fetch(`https://api.keepa.com/product?key=${accessKey}&domain=1&code=${upc}&stats=180&buybox=1&offers=20`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Keepa API error: ${response.status}`);
    }

    const data = await response.json();
    const prices: MerchantPrice[] = [];

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      
      // Current Amazon price
      if (product.stats && product.stats.current && product.stats.current[0] !== null) {
        prices.push({
          merchant: 'Amazon',
          price: product.stats.current[0] / 100, // Keepa prices are in cents
          currency: 'USD',
          availability: 'in_stock',
          url: `https://www.amazon.com/dp/${product.asin}`,
          lastUpdated: new Date()
        });
      }

      // Third-party offers on Amazon
      if (product.offers) {
        for (const offer of product.offers.slice(0, 5)) {
          if (offer.price) {
            prices.push({
              merchant: `Amazon (${offer.sellerName || 'Third-party'})`,
              price: offer.price / 100,
              currency: 'USD',
              availability: offer.isPrime ? 'in_stock' : 'limited',
              url: `https://www.amazon.com/dp/${product.asin}`,
              shipping: offer.shippingCost ? `$${offer.shippingCost / 100}` : undefined,
              lastUpdated: new Date()
            });
          }
        }
      }
    }

    return prices;
  } catch (error) {
    console.error(`Keepa API error: ${(error as Error).message}`);
    return [];
  }
}

// Web scraping approach for major retailers (as fallback)
export async function scrapeMajorRetailerPrices(upc: string, productName?: string): Promise<MerchantPrice[]> {
  // Note: Web scraping should be done respectfully and in compliance with robots.txt
  // This is a conceptual implementation - in production, use official APIs when available
  
  const prices: MerchantPrice[] = [];
  const retailers = [
    { name: 'Target', searchUrl: `https://www.target.com/s?searchTerm=${upc}` },
    { name: 'Walmart', searchUrl: `https://www.walmart.com/search?q=${upc}` },
    { name: 'Best Buy', searchUrl: `https://www.bestbuy.com/site/searchpage.jsp?st=${upc}` },
    { name: 'CVS', searchUrl: `https://www.cvs.com/shop?searchTerm=${upc}` },
    { name: 'Walgreens', searchUrl: `https://www.walgreens.com/search/results.jsp?Ntt=${upc}` }
  ];

  console.log("Note: Web scraping requires careful implementation to respect robots.txt and rate limits");
  console.log("Consider using official APIs instead: Target RedSky, Walmart Labs, etc.");

  return prices;
}

// Main function to aggregate prices from all sources
export async function getAllMerchantPrices(upc: string, productName?: string): Promise<PricingResponse> {
  const allPrices: MerchantPrice[] = [];
  const sources: string[] = [];

  try {
    // Fetch from all available pricing APIs
    const shoppingPrices = await fetchShoppingComPrices(upc);
    if (shoppingPrices.length > 0) {
      allPrices.push(...shoppingPrices);
      sources.push('Shopping.com');
    }

    const googlePrices = await fetchGoogleShoppingPrices(upc, productName);
    if (googlePrices.length > 0) {
      allPrices.push(...googlePrices);
      sources.push('Google Shopping');
    }

    const keepaPrices = await fetchKeepaAmazonPrices(upc);
    if (keepaPrices.length > 0) {
      allPrices.push(...keepaPrices);
      sources.push('Keepa (Amazon)');
    }

    const priceApiPrices = await fetchPriceApiPrices(upc);
    if (priceApiPrices.length > 0) {
      allPrices.push(...priceApiPrices);
      sources.push('PriceAPI');
    }

    // Remove duplicates and sort by price
    const uniquePrices = allPrices.filter((price, index, self) => 
      index === self.findIndex(p => p.merchant === price.merchant)
    ).sort((a, b) => a.price - b.price);

    return {
      barcode: upc,
      prices: uniquePrices,
      sources,
      success: true
    };

  } catch (error) {
    return {
      barcode: upc,
      prices: [],
      sources,
      success: false,
      error: (error as Error).message
    };
  }
}

// Price comparison utilities
export function findLowestPrice(prices: MerchantPrice[]): MerchantPrice | null {
  if (prices.length === 0) return null;
  return prices.reduce((lowest, current) => 
    current.price < lowest.price ? current : lowest
  );
}

export function findHighestPrice(prices: MerchantPrice[]): MerchantPrice | null {
  if (prices.length === 0) return null;
  return prices.reduce((highest, current) => 
    current.price > highest.price ? current : highest
  );
}

export function calculatePriceSavings(prices: MerchantPrice[]): number {
  const lowest = findLowestPrice(prices);
  const highest = findHighestPrice(prices);
  
  if (!lowest || !highest) return 0;
  return highest.price - lowest.price;
}

export function getAveragePrice(prices: MerchantPrice[]): number {
  if (prices.length === 0) return 0;
  const total = prices.reduce((sum, price) => sum + price.price, 0);
  return total / prices.length;
}