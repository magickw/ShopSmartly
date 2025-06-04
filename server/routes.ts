import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

  // Barcode scanning endpoint
  app.post("/api/scan", async (req, res) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.status(400).json({ message: "Barcode is required" });
      }

      const product = await storage.getProductByBarcode(barcode);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Find best price
      const bestPrice = product.prices.reduce((min, current) => {
        const currentPrice = parseFloat(current.price.replace('$', ''));
        const minPrice = parseFloat(min.price.replace('$', ''));
        return currentPrice < minPrice ? current : min;
      });

      // Add to scan history
      await storage.addScanHistory({
        barcode,
        productName: product.name,
        bestPrice: bestPrice.price
      });

      res.json({
        product,
        bestPrice: bestPrice.price
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
      console.error("History error:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
