import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  fetchProductData, 
  findBestPrice, 
  calculateSavings 
} from "./barcodeApis";
import { 
  getAllMerchantPrices, 
  findLowestPrice, 
  calculatePriceSavings 
} from "./pricingApis";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple in-memory scan tracking
let dailyScanCount = 0;
const DAILY_SCAN_LIMIT = 10;

async function generateShoppingAssistantResponse(message: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a helpful shopping assistant. Help users with price comparisons, product recommendations, and shopping advice. Keep responses concise and practical."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 300
    });

    return response.choices[0].message.content || "I'm here to help with your shopping questions!";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again later.";
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock auth route for testing
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      res.json({
        id: "test-user",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
        subscriptionTier: "free",
        subscriptionExpiresAt: null,
        dailyScansCount: 5,
        lastScanResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get product by barcode (for browsing - no scan limit impact)
  app.get("/api/products/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      
      let product = await storage.getProductByBarcode(barcode);
      
      if (!product) {
        return res.status(404).json({ 
          message: "Product not found",
          suggestion: "Try scanning this product to add it to our database"
        });
      }

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

      res.json({
        product,
        bestPrice
      });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Barcode scanning endpoint (counts toward daily limits and adds to history)
  app.post("/api/scan", async (req, res) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.status(400).json({ message: "Barcode is required" });
      }

      // Check scan limit
      if (dailyScanCount >= DAILY_SCAN_LIMIT) {
        return res.status(429).json({ 
          message: "Daily scan limit reached",
          upgradeRequired: true,
          scansRemaining: 0
        });
      }

      let product = await storage.getProductByBarcode(barcode);
      
      if (!product) {
        console.log(`Fetching product data from APIs for barcode: ${barcode}`);
        const apiResult = await fetchProductData(barcode);
        
        if (!apiResult.product) {
          return res.status(404).json({ 
            message: "Product not found in any database",
            suggestion: "This product may not be in our supported databases. Try scanning a different product or check if the barcode is clear and readable."
          });
        }
        
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
        
        if (apiResult.prices && apiResult.prices.length > 0) {
          console.log(`Found ${apiResult.prices.length} merchant offers from UPC Item DB`);
          for (const priceInfo of apiResult.prices) {
            let retailers = await storage.getAllRetailers();
            let retailer = retailers.find(r => r.name === priceInfo.retailer);
            
            if (!retailer) {
              retailer = await storage.createRetailer({
                name: priceInfo.retailer,
                logo: priceInfo.retailer.charAt(0),
                affiliateProgram: null,
                affiliateCommissionRate: null,
                affiliateBaseUrl: null
              });
            }

            await storage.createPrice({
              productId: product.id,
              retailerId: retailer.id,
              price: priceInfo.price,
              stock: priceInfo.availability,
              url: priceInfo.url || null
            });
          }

          product = await storage.getProductByBarcode(barcode);
        }
      }
      
      if (!product) {
        return res.status(404).json({ 
          message: "Product not found in any database"
        });
      }

      // Add to scan history when scanning from scanner page
      await storage.addScanHistory({
        barcode,
        productName: product.name
      });

      // Increment scan count for daily limit tracking
      dailyScanCount++;

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

      res.json({
        product,
        bestPrice
      });
    } catch (error) {
      console.error("Scan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get scan history
  app.get("/api/history", async (req, res) => {
    try {
      const history = await storage.getScanHistory();
      res.json(history);
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clear scan history
  app.delete("/api/history", async (req, res) => {
    try {
      await storage.clearScanHistory();
      res.json({ message: "History cleared" });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get favorites
  app.get("/api/favorites", async (req, res) => {
    try {
      const favorites = await storage.getFavorites();
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add to favorites
  app.post("/api/favorites", async (req, res) => {
    try {
      const { productId } = req.body;
      const favorite = await storage.addFavorite({ productId });
      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove from favorites
  app.delete("/api/favorites/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      await storage.removeFavorite(productId);
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get shopping list
  app.get("/api/shopping-list", async (req, res) => {
    try {
      const shoppingList = await storage.getShoppingList();
      res.json(shoppingList);
    } catch (error) {
      console.error("Get shopping list error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add to shopping list
  app.post("/api/shopping-list", async (req, res) => {
    try {
      const { productId, quantity, unitPrice } = req.body;
      const item = await storage.addShoppingListItem({
        productId,
        quantity: quantity || 1,
        unitPrice: unitPrice || null,
        completed: false,
        userId: null
      });
      res.json(item);
    } catch (error) {
      console.error("Add to shopping list error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update shopping list item
  app.patch("/api/shopping-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateShoppingListItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Update shopping list error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove from shopping list
  app.delete("/api/shopping-list/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeShoppingListItem(id);
      res.json({ message: "Removed from shopping list" });
    } catch (error) {
      console.error("Remove from shopping list error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subscription status with real scan count tracking
  app.get("/api/subscription/status", async (req: any, res) => {
    try {
      const scansRemaining = Math.max(0, DAILY_SCAN_LIMIT - dailyScanCount);
      const canScan = scansRemaining > 0;
      
      res.json({
        tier: "free",
        expiresAt: null,
        scanLimits: {
          canScan,
          scansRemaining,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    } catch (error) {
      console.error("Get subscription status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Shopping assistant chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await generateShoppingAssistantResponse(message);
      
      if (userId) {
        await storage.addChatMessage({
          userId,
          message,
          response,
          isUser: true
        });
      }
      
      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get chat history
  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const history = await storage.getChatHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Get chat history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}