import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScanHistorySchema, insertFavoriteSchema, insertShoppingListItemSchema, insertProductSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  const httpServer = createServer(app);
  return httpServer;
}
