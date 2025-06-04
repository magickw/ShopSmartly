// Barcode/UPC Database APIs integration for authentic product data and pricing
// This file provides multiple API integrations for comprehensive product information

interface ProductInfo {
  name: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  upc: string;
}

interface PriceInfo {
  retailer: string;
  price: string;
  currency: string;
  availability: string;
  url?: string;
}

interface BarcodeApiResponse {
  product?: ProductInfo;
  prices?: PriceInfo[];
  success: boolean;
  error?: string;
}

// UPC Database API (upcitemdb.com) - Free tier available
export async function fetchFromUPCItemDB(barcode: string): Promise<BarcodeApiResponse> {
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Smart Shopping Assistant'
      }
    });

    if (!response.ok) {
      throw new Error(`UPC API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === "OK" && data.items && data.items.length > 0) {
      const item = data.items[0];
      
      // Extract merchant pricing from offers
      const prices: PriceInfo[] = [];
      if (item.offers && Array.isArray(item.offers)) {
        for (const offer of item.offers) {
          if (offer.merchant && offer.price) {
            prices.push({
              retailer: offer.merchant,
              price: `$${parseFloat(offer.price).toFixed(2)}`,
              currency: offer.currency || 'USD',
              availability: offer.availability || offer.condition || 'Check availability',
              url: offer.link
            });
          }
        }
      }
      
      return {
        success: true,
        product: {
          name: item.title || "Unknown Product",
          brand: item.brand || undefined,
          description: item.description || undefined,
          imageUrl: item.images && item.images.length > 0 ? item.images[0] : undefined,
          category: item.category || undefined,
          upc: barcode
        },
        prices: prices
      };
    }

    return { success: false, error: "Product not found in UPC database" };
  } catch (error) {
    return { success: false, error: `UPC API error: ${(error as Error).message}` };
  }
}

// Barcode Spider API (barcodespider.com) - Requires API key
export async function fetchFromBarcodeSpider(barcode: string): Promise<BarcodeApiResponse> {
  const apiKey = process.env.BARCODE_SPIDER_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "BARCODE_SPIDER_API_KEY not configured" };
  }

  try {
    const response = await fetch(`https://api.barcodespider.com/v1/lookup?token=${apiKey}&upc=${barcode}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Barcode Spider API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.item_response && data.item_response.code === 200) {
      const item = data.item_response.item;
      return {
        success: true,
        product: {
          name: item.title || "Unknown Product",
          brand: item.brand || undefined,
          description: item.description || undefined,
          imageUrl: item.images && item.images.length > 0 ? item.images[0] : undefined,
          category: item.category || undefined,
          upc: barcode
        }
      };
    }

    return { success: false, error: "Product not found in Barcode Spider" };
  } catch (error) {
    return { success: false, error: `Barcode Spider API error: ${(error as Error).message}` };
  }
}

// Open Food Facts API (for food products) - Free
export async function fetchFromOpenFoodFacts(barcode: string): Promise<BarcodeApiResponse> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Smart Shopping Assistant'
      }
    });

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      const product = data.product;
      return {
        success: true,
        product: {
          name: product.product_name || product.product_name_en || "Unknown Product",
          brand: product.brands || undefined,
          description: product.ingredients_text || undefined,
          imageUrl: product.image_url || product.image_front_url || undefined,
          category: product.categories || undefined,
          upc: barcode
        }
      };
    }

    return { success: false, error: "Product not found in Open Food Facts" };
  } catch (error) {
    return { success: false, error: `Open Food Facts API error: ${(error as Error).message}` };
  }
}

// Walmart Open API - Requires API key
export async function fetchWalmartPrices(upc: string): Promise<PriceInfo[]> {
  const apiKey = process.env.WALMART_API_KEY;
  
  if (!apiKey) {
    console.log("WALMART_API_KEY not configured");
    return [];
  }

  try {
    const response = await fetch(`https://api.walmartlabs.com/v1/items?apikey=${apiKey}&upc=${upc}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Walmart API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items.map((item: any) => ({
        retailer: "Walmart",
        price: `$${item.salePrice || item.msrp}`,
        currency: "USD",
        availability: item.availableOnline ? "In Stock" : "Out of Stock",
        url: item.productUrl
      }));
    }

    return [];
  } catch (error) {
    console.error(`Walmart API error: ${error.message}`);
    return [];
  }
}

// Target API (RedSky API) - Public endpoints
export async function fetchTargetPrices(upc: string): Promise<PriceInfo[]> {
  try {
    // Using Target's public product search API
    const response = await fetch(`https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=ff457966e64d5e877fdbad070f276d18ecec4a01&tcin=${upc}&pricing_store_id=3991`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Smart Shopping Assistant)'
      }
    });

    if (!response.ok) {
      throw new Error(`Target API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.product) {
      const product = data.data.product;
      const pricing = product.price;
      
      if (pricing && pricing.current_retail) {
        return [{
          retailer: "Target",
          price: `$${pricing.current_retail}`,
          currency: "USD",
          availability: product.fulfillment?.is_out_of_stock_in_all_store_locations ? "Out of Stock" : "In Stock",
          url: `https://www.target.com/p/-/A-${product.tcin}`
        }];
      }
    }

    return [];
  } catch (error) {
    console.error(`Target API error: ${error.message}`);
    return [];
  }
}

// Amazon Product Advertising API - Requires credentials
export async function fetchAmazonPrices(upc: string): Promise<PriceInfo[]> {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  
  if (!accessKey || !secretKey || !partnerTag) {
    console.log("Amazon API credentials not configured");
    return [];
  }

  // Amazon Product Advertising API implementation would go here
  // This requires AWS signature v4 authentication
  console.log("Amazon API integration requires full AWS setup");
  return [];
}

// Main function to fetch product data from multiple sources
export async function fetchProductData(barcode: string): Promise<{
  product?: ProductInfo;
  prices: PriceInfo[];
  sources: string[];
}> {
  const results: BarcodeApiResponse[] = [];
  const prices: PriceInfo[] = [];
  const sources: string[] = [];

  // Try multiple product databases
  const upcResult = await fetchFromUPCItemDB(barcode);
  results.push(upcResult);
  if (upcResult.success) sources.push("UPC Database");

  const foodResult = await fetchFromOpenFoodFacts(barcode);
  results.push(foodResult);
  if (foodResult.success) sources.push("Open Food Facts");

  const spiderResult = await fetchFromBarcodeSpider(barcode);
  results.push(spiderResult);
  if (spiderResult.success) sources.push("Barcode Spider");

  // Get pricing from retailers
  const walmartPrices = await fetchWalmartPrices(barcode);
  prices.push(...walmartPrices);
  if (walmartPrices.length > 0) sources.push("Walmart");

  const targetPrices = await fetchTargetPrices(barcode);
  prices.push(...targetPrices);
  if (targetPrices.length > 0) sources.push("Target");

  // Find the best product info (prefer UPC Database, then others)
  const successfulResult = results.find(r => r.success && r.product);
  
  return {
    product: successfulResult?.product,
    prices,
    sources
  };
}

// Price comparison utilities
export function findBestPrice(prices: PriceInfo[]): PriceInfo | null {
  if (prices.length === 0) return null;
  
  return prices.reduce((best, current) => {
    const bestPrice = parseFloat(best.price.replace(/[^0-9.]/g, ''));
    const currentPrice = parseFloat(current.price.replace(/[^0-9.]/g, ''));
    return currentPrice < bestPrice ? current : best;
  });
}

export function calculateSavings(prices: PriceInfo[]): number {
  if (prices.length < 2) return 0;
  
  const sortedPrices = prices
    .map(p => parseFloat(p.price.replace(/[^0-9.]/g, '')))
    .sort((a, b) => a - b);
    
  return sortedPrices[sortedPrices.length - 1] - sortedPrices[0];
}