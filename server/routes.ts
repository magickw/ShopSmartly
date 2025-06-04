import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchProductData, findBestPrice, calculateSavings } from "./barcodeApis";
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
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
  // Temporary auth endpoint that returns null (no authentication for now)
  app.get('/api/auth/user', async (req, res) => {
    res.json(null);
  });
  
  // Product creation endpoint
  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product update endpoint
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(productId, updates);
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Barcode scanning endpoint with authentic API integration
  app.post("/api/scan", async (req, res) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.status(400).json({ message: "Barcode is required" });
      }

      // First check if product exists in our database
      let product = await storage.getProductByBarcode(barcode);
      
      if (!product) {
        // Fetch from authentic barcode APIs
        console.log(`Fetching product data from APIs for barcode: ${barcode}`);
        const apiResult = await fetchProductData(barcode);
        
        if (apiResult.product) {
          // Create product in our database with API data
          const productData = {
            barcode,
            name: apiResult.product.name,
            brand: apiResult.product.brand || null,
            description: apiResult.product.description || null,
            imageUrl: apiResult.product.imageUrl || null,
            ecoScore: null, // Will be populated later
            carbonFootprint: null,
            recyclingInfo: null,
            sustainabilityCertifications: null,
            packagingType: null,
            isEcoFriendly: null
          };

          const createdProduct = await storage.createProduct(productData);
          
          // Create retailers and prices from API data
          for (const priceInfo of apiResult.prices) {
            // Get or create retailer
            let retailers = await storage.getAllRetailers();
            let retailer = retailers.find(r => r.name === priceInfo.retailer);
            
            if (!retailer) {
              retailer = await storage.createRetailer({
                name: priceInfo.retailer,
                logo: priceInfo.retailer.charAt(0)
              });
            }

            // Create price entry
            await storage.createPrice({
              productId: createdProduct.id,
              retailerId: retailer.id,
              price: priceInfo.price,
              stock: priceInfo.availability,
              url: priceInfo.url || null
            });
          }

          // Fetch the complete product with prices
          product = await storage.getProductByBarcode(barcode);
        }
        
        if (!product) {
          return res.status(404).json({ 
            message: "Product not found in any database",
            sources: apiResult.sources || [],
            suggestion: "This product may not be in our supported databases. Try scanning a different product or check if the barcode is clear and readable.",
            availableApis: [
              "UPC Database (free tier)",
              "Open Food Facts (food products)",
              "Barcode Spider (requires API key)",
              "Walmart API (requires API key)",
              "Target API (public endpoints)"
            ]
          });
        }
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
        productName: product.name,
        bestPrice: bestPrice
      });

      res.json({
        product,
        bestPrice: bestPrice,
        savings: product.prices.length > 1 ? calculateSavings(product.prices.map(p => ({
          retailer: p.retailer.name,
          price: p.price,
          currency: "USD",
          availability: p.stock || "Available"
        }))) : 0
      });
    } catch (error) {
      console.error("Scan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Refresh product pricing from APIs
  app.post("/api/products/:barcode/refresh-prices", async (req, res) => {
    try {
      const { barcode } = req.params;
      
      console.log(`Refreshing pricing data for barcode: ${barcode}`);
      const apiResult = await fetchProductData(barcode);
      
      if (apiResult.prices.length === 0) {
        return res.json({
          message: "No pricing data available from APIs",
          sources: apiResult.sources,
          suggestion: "API keys may be required for Walmart, Target, and other retailers"
        });
      }

      // Get existing product
      const product = await storage.getProductByBarcode(barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Update prices from API data
      let updatedPrices = 0;
      for (const priceInfo of apiResult.prices) {
        // Get or create retailer
        let retailers = await storage.getAllRetailers();
        let retailer = retailers.find(r => r.name === priceInfo.retailer);
        
        if (!retailer) {
          retailer = await storage.createRetailer({
            name: priceInfo.retailer,
            logo: priceInfo.retailer.charAt(0)
          });
        }

        // Create or update price entry
        await storage.createPrice({
          productId: product.id,
          retailerId: retailer.id,
          price: priceInfo.price,
          stock: priceInfo.availability,
          url: priceInfo.url || null
        });
        updatedPrices++;
      }

      res.json({
        message: `Updated ${updatedPrices} prices from ${apiResult.sources.length} sources`,
        sources: apiResult.sources,
        pricesUpdated: updatedPrices
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
      res.json({ success: true });
    } catch (error) {
      console.error("Clear scan history error:", error);
      res.status(500).json({ message: "Failed to clear scan history" });
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
      const favoriteData = insertFavoriteSchema.parse(req.body);
      const favorite = await storage.addFavorite(favoriteData);
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
      res.json({ success: true });
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
      const itemData = insertShoppingListItemSchema.parse(req.body);
      const item = await storage.addShoppingListItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Add shopping list item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/shopping-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateShoppingListItem(id, updates);
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
      res.json({ success: true });
    } catch (error) {
      console.error("Remove shopping list item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chat API routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId = "anonymous" } = req.body;
      
      // Save user message
      await storage.addChatMessage({
        userId,
        message,
        isUser: true,
        response: null,
      });

      // Generate AI response using Perplexity API
      const response = await generateShoppingAssistantResponse(message);
      
      // Save assistant response
      await storage.addChatMessage({
        userId,
        message: response,
        isUser: false,
        response: null,
      });

      res.json({ response });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const history = await storage.getChatHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  app.delete("/api/chat/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.clearChatHistory(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });

  // Advertisement routes
  app.get("/api/ads/:placement", async (req, res) => {
    try {
      const { placement } = req.params;
      const ads = await storage.getActiveAds(placement);
      
      // Increment impressions for all returned ads
      for (const ad of ads) {
        await storage.incrementAdImpressions(ad.id);
      }
      
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.post("/api/ads/click", async (req, res) => {
    try {
      const { advertisementId, userAgent } = req.body;
      
      const click = await storage.trackAdClick({
        advertisementId,
        userAgent: userAgent || null,
      });
      
      res.json(click);
    } catch (error) {
      console.error("Error tracking ad click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
