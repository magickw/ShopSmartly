import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchProductData, findBestPrice, calculateSavings } from "./barcodeApis";
import { getAllMerchantPrices, findLowestPrice, calculatePriceSavings } from "./pricingApis";
import { insertScanHistorySchema, insertFavoriteSchema, insertShoppingListItemSchema, insertProductSchema } from "@shared/schema";

async function generateShoppingAssistantResponse(message: string): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    return "I'm your shopping assistant! I can help you find products, compare prices, and manage your shopping list. However, I need the OpenAI API key to provide AI-powered shopping advice. Please ask your administrator to configure it.";
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful shopping assistant. Provide concise, practical advice about products, prices, shopping tips, and product recommendations. Keep responses under 150 words and be friendly and helpful.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
        response_format: { type: "text" }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm here to help with your shopping needs!";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "I'm your shopping assistant! I can help you find products, compare prices, and manage your shopping list. How can I assist you today?";
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Chat assistant endpoint  
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await generateShoppingAssistantResponse(message);

      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get existing product data without triggering new scan
  app.get("/api/products/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      
      if (!barcode) {
        return res.status(400).json({ message: "Barcode is required" });
      }

      // Get existing product from database
      const product = await storage.getProductByBarcode(barcode);
      
      if (!product) {
        return res.status(404).json({ 
          message: "Product not found",
          suggestion: "Scan this barcode first to add it to the database"
        });
      }

      // Find best price
      let bestPrice = "N/A";
      if (product.prices && product.prices.length > 0) {
        const bestPriceInfo = findBestPrice(product.prices.map(p => ({
          retailer: p.retailer.name,
          price: p.price,
          currency: "USD",
          availability: p.stock || "Available"
        })));
        
        if (bestPriceInfo) {
          bestPrice = bestPriceInfo.price;
        }
      }

      // Add to scan history when accessing existing product
      await storage.addScanHistory({
        barcode,
        productName: product.name
      });

      res.json({
        product,
        bestPrice
      });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Barcode scanning endpoint with UPC Item DB pricing
  app.post("/api/scan", async (req, res) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.status(400).json({ message: "Barcode is required" });
      }

      // Always fetch fresh data from UPC Item DB
      console.log(`Fetching product data from APIs for barcode: ${barcode}`);
      const apiResult = await fetchProductData(barcode);
      
      // Check if product exists in our database
      let product = await storage.getProductByBarcode(barcode);
      
      if (!product && apiResult.product) {
        // Create new product
        const productData = {
          barcode,
          name: apiResult.product.name,
          brand: apiResult.product.brand || null,
          description: apiResult.product.description || null,
          imageUrl: apiResult.product.imageUrl || null,
          ecoScore: null,
          carbonFootprint: null,
          recyclingInfo: null,
          sustainabilityCertifications: null,
          packagingType: null,
          isEcoFriendly: null
        };

        const createdProduct = await storage.createProduct(productData);
        product = { ...createdProduct, prices: [] };
      }

      // Update pricing data from UPC Item DB
      if (product && apiResult.prices && apiResult.prices.length > 0) {
        console.log(`Found ${apiResult.prices.length} merchant offers from UPC Item DB`);
        for (const priceInfo of apiResult.prices) {
          console.log(`Creating price entry for ${priceInfo.retailer}: ${priceInfo.price}`);
          
          // Get or create retailer
          let retailers = await storage.getAllRetailers();
          let retailer = retailers.find(r => r.name === priceInfo.retailer);
          
          if (!retailer) {
            retailer = await storage.createRetailer({
              name: priceInfo.retailer,
              logo: priceInfo.retailer.charAt(0)
            });
            console.log(`Created new retailer: ${retailer.name}`);
          }

          // Create price entry
          await storage.createPrice({
            productId: product.id,
            retailerId: retailer.id,
            price: priceInfo.price,
            stock: priceInfo.availability,
            url: priceInfo.url || null
          });
        }

        // Fetch the updated product with all prices
        product = await storage.getProductByBarcode(barcode);
        console.log(`Product after price update:`, JSON.stringify(product, null, 2));
      }
        
      if (!product) {
        return res.status(404).json({ 
          message: "Product not found in any database",
          suggestion: "This product may not be in our supported databases. Try scanning a different product or check if the barcode is clear and readable."
        });
      }

      // Find best price
      let bestPrice = "N/A";
      if (product.prices && product.prices.length > 0) {
        const bestPriceInfo = findBestPrice(product.prices.map(p => ({
          retailer: p.retailer.name,
          price: p.price,
          currency: "USD",
          availability: p.stock || "Available"
        })));
        
        if (bestPriceInfo) {
          bestPrice = bestPriceInfo.price;
        }
      }

      // Add to scan history
      await storage.addScanHistory({
        barcode,
        productName: product.name
      });

      res.json({
        product,
        bestPrice
      });
    } catch (error) {
      console.error("Scan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Refresh product pricing from merchant APIs
  app.post("/api/products/:barcode/refresh-prices", async (req, res) => {
    try {
      const { barcode } = req.params;
      
      // Get existing product
      const product = await storage.getProductByBarcode(barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      console.log(`Refreshing merchant pricing data for: ${product.name}`);
      const pricingResult = await getAllMerchantPrices(barcode, product.name);
      
      if (pricingResult.prices.length === 0) {
        return res.json({
          message: "No merchant pricing data available",
          sources: pricingResult.sources,
          suggestion: "API keys required for Shopping.com, Google Shopping, Keepa, and PriceAPI",
          availableApis: [
            "Shopping.com (requires SHOPPING_API_KEY)",
            "Google Shopping (requires GOOGLE_API_KEY and GOOGLE_SHOPPING_CX)",
            "Keepa Amazon tracking (requires KEEPA_API_KEY)",
            "PriceAPI (requires PRICEAPI_KEY)",
            "FakeSpot analysis (requires FAKESPOT_API_KEY)"
          ]
        });
      }

      // Update prices from merchant APIs
      let updatedPrices = 0;
      for (const merchantPrice of pricingResult.prices) {
        // Get or create retailer
        let retailers = await storage.getAllRetailers();
        let retailer = retailers.find(r => r.name === merchantPrice.merchant);
        
        if (!retailer) {
          retailer = await storage.createRetailer({
            name: merchantPrice.merchant,
            logo: merchantPrice.merchant.charAt(0)
          });
        }

        // Create or update price entry
        await storage.createPrice({
          productId: product.id,
          retailerId: retailer.id,
          price: `$${merchantPrice.price.toFixed(2)}`,
          stock: merchantPrice.availability === 'in_stock' ? 'In Stock' : 
                 merchantPrice.availability === 'out_of_stock' ? 'Out of Stock' : 'Check Availability',
          url: merchantPrice.url || null
        });
        updatedPrices++;
      }

      res.json({
        message: `Updated ${updatedPrices} merchant prices from ${pricingResult.sources.length} sources`,
        sources: pricingResult.sources,
        pricesUpdated: updatedPrices,
        lowestPrice: findLowestPrice(pricingResult.prices),
        savings: calculatePriceSavings(pricingResult.prices)
      });
    } catch (error) {
      console.error("Refresh prices error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get scan history
  app.get("/api/history", async (req, res) => {
    try {
      const history = await storage.getScanHistory();
      res.json(history);
    } catch (error) {
      console.error("History error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clear scan history
  app.delete("/api/history", async (req, res) => {
    try {
      await storage.clearScanHistory();
      res.json({ message: "History cleared successfully" });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Favorites endpoints
  app.get("/api/favorites", async (req, res) => {
    try {
      const favorites = await storage.getFavorites();
      res.json(favorites);
    } catch (error) {
      console.error("Favorites error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validation = insertFavoriteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid favorite data", errors: validation.error.errors });
      }

      const favorite = await storage.addFavorite(validation.data);
      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/favorites/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      await storage.removeFavorite(productId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Shopping list endpoints
  app.get("/api/shopping-list", async (req, res) => {
    try {
      const shoppingList = await storage.getShoppingList();
      res.json(shoppingList);
    } catch (error) {
      console.error("Shopping list error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/shopping-list", async (req, res) => {
    try {
      const validation = insertShoppingListItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid shopping list item data", errors: validation.error.errors });
      }

      const item = await storage.addShoppingListItem(validation.data);
      res.json(item);
    } catch (error) {
      console.error("Add shopping list item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/shopping-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateShoppingListItem(id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Update shopping list item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/shopping-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeShoppingListItem(id);
      res.json({ message: "Shopping list item removed successfully" });
    } catch (error) {
      console.error("Remove shopping list item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Advertisement endpoints
  app.get("/api/ads/:placement", async (req, res) => {
    try {
      const { placement } = req.params;
      const ads = await storage.getActiveAds(placement);
      res.json(ads);
    } catch (error) {
      console.error("Get ads error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}