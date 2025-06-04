import {
  products,
  retailers,
  prices,
  scanHistory,
  favorites,
  shoppingListItems,
  chatMessages,
  advertisements,
  adClicks,
  users,
  type Product,
  type InsertProduct,
  type Retailer,
  type InsertRetailer,
  type Price,
  type InsertPrice,
  type ScanHistory,
  type InsertScanHistory,
  type Favorite,
  type InsertFavorite,
  type ShoppingListItem,
  type InsertShoppingListItem,
  type ChatMessage,
  type InsertChatMessage,
  type Advertisement,
  type InsertAdvertisement,
  type AdClick,
  type InsertAdClick,
  type ProductWithPrices,
  type User,
  type UpsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Products
  getProductByBarcode(barcode: string): Promise<ProductWithPrices | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  
  // Retailers
  getAllRetailers(): Promise<Retailer[]>;
  createRetailer(retailer: InsertRetailer): Promise<Retailer>;
  
  // Prices
  createPrice(price: InsertPrice): Promise<Price>;
  
  // Scan History
  addScanHistory(scan: InsertScanHistory): Promise<ScanHistory>;
  getScanHistory(): Promise<ScanHistory[]>;
  clearScanHistory(): Promise<void>;
  
  // Favorites
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(productId: number): Promise<void>;
  getFavorites(): Promise<(Favorite & { product: ProductWithPrices })[]>;
  
  // Shopping List
  addShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItem(id: number, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem>;
  removeShoppingListItem(id: number): Promise<void>;
  getShoppingList(): Promise<(ShoppingListItem & { product: ProductWithPrices })[]>;
  
  // Chat Messages
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(userId: string): Promise<ChatMessage[]>;
  clearChatHistory(userId: string): Promise<void>;
  
  // Advertisements
  getActiveAds(placement: string): Promise<Advertisement[]>;
  trackAdClick(click: InsertAdClick): Promise<AdClick>;
  incrementAdImpressions(adId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProductByBarcode(barcode: string): Promise<ProductWithPrices | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    if (!product) return undefined;

    const productPrices = await db
      .select({
        id: prices.id,
        productId: prices.productId,
        retailerId: prices.retailerId,
        price: prices.price,
        stock: prices.stock,
        url: prices.url,
        retailer: retailers,
      })
      .from(prices)
      .innerJoin(retailers, eq(prices.retailerId, retailers.id))
      .where(eq(prices.productId, product.id));

    return {
      ...product,
      prices: productPrices,
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async getAllRetailers(): Promise<Retailer[]> {
    return await db.select().from(retailers);
  }

  async createRetailer(retailer: InsertRetailer): Promise<Retailer> {
    const [newRetailer] = await db
      .insert(retailers)
      .values(retailer)
      .returning();
    return newRetailer;
  }

  async createPrice(price: InsertPrice): Promise<Price> {
    const [newPrice] = await db
      .insert(prices)
      .values(price)
      .returning();
    return newPrice;
  }

  async addScanHistory(scan: InsertScanHistory): Promise<ScanHistory> {
    const [newScan] = await db
      .insert(scanHistory)
      .values(scan)
      .returning();
    return newScan;
  }

  async getScanHistory(): Promise<ScanHistory[]> {
    return await db
      .select()
      .from(scanHistory)
      .orderBy(scanHistory.scannedAt)
      .limit(50);
  }

  async clearScanHistory(): Promise<void> {
    try {
      await db.delete(scanHistory);
    } catch (error) {
      console.error("Error clearing scan history:", error);
      throw new Error("Failed to clear scan history");
    }
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db
      .insert(favorites)
      .values(favorite)
      .returning();
    return newFavorite;
  }

  async removeFavorite(productId: number): Promise<void> {
    await db.delete(favorites).where(eq(favorites.productId, productId));
  }

  async getFavorites(): Promise<(Favorite & { product: ProductWithPrices })[]> {
    const favoritesList = await db.select().from(favorites);
    const result = [];

    for (const favorite of favoritesList) {
      const product = await this.getProductByBarcode(
        (await db.select().from(products).where(eq(products.id, favorite.productId)))[0]?.barcode || ""
      );
      if (product) {
        result.push({
          ...favorite,
          product,
        });
      }
    }

    return result;
  }

  async addShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [newItem] = await db
      .insert(shoppingListItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateShoppingListItem(id: number, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem> {
    const [updatedItem] = await db
      .update(shoppingListItems)
      .set(updates)
      .where(eq(shoppingListItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeShoppingListItem(id: number): Promise<void> {
    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));
  }

  async getShoppingList(): Promise<(ShoppingListItem & { product: ProductWithPrices })[]> {
    const items = await db.select().from(shoppingListItems);
    const result = [];

    for (const item of items) {
      const product = await this.getProductByBarcode(
        (await db.select().from(products).where(eq(products.id, item.productId)))[0]?.barcode || ""
      );
      if (product) {
        result.push({
          ...item,
          product,
        });
      }
    }

    return result;
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return chatMessage;
  }

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.timestamp);
  }

  async clearChatHistory(userId: string): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.userId, userId));
  }

  // Advertisement operations
  async getActiveAds(placement: string): Promise<Advertisement[]> {
    const activeAds = await db.select().from(advertisements).where(
      eq(advertisements.placement, placement)
    );
    
    // If no ads in database, return mock ads for development
    if (activeAds.length === 0) {
      return [
        {
          id: 1,
          title: "Premium Shopping Assistant Pro",
          description: "Upgrade to Pro for advanced price tracking and notifications",
          imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
          targetUrl: "https://example.com/upgrade",
          advertiser: "ShopSmart",
          adType: "banner",
          placement: placement,
          impressions: 150,
          clicks: 12,
          isActive: true,
          startDate: new Date(),
          endDate: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "Eco-Friendly Product Finder",
          description: "Discover sustainable alternatives for all your shopping needs",
          imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400",
          targetUrl: "https://example.com/eco",
          advertiser: "GreenChoice",
          adType: "native",
          placement: placement,
          impressions: 89,
          clicks: 7,
          isActive: true,
          startDate: new Date(),
          endDate: null,
          createdAt: new Date(),
        }
      ];
    }
    
    return activeAds;
  }

  async trackAdClick(click: InsertAdClick): Promise<AdClick> {
    const [newClick] = await db
      .insert(adClicks)
      .values(click)
      .returning();
    
    // Get current ad and increment clicks
    const [currentAd] = await db.select().from(advertisements).where(eq(advertisements.id, click.advertisementId));
    if (currentAd) {
      await db.update(advertisements)
        .set({ clicks: (currentAd.clicks || 0) + 1 })
        .where(eq(advertisements.id, click.advertisementId));
    }
    
    return newClick;
  }

  async incrementAdImpressions(adId: number): Promise<void> {
    const [currentAd] = await db.select().from(advertisements).where(eq(advertisements.id, adId));
    if (currentAd) {
      await db.update(advertisements)
        .set({ impressions: (currentAd.impressions || 0) + 1 })
        .where(eq(advertisements.id, adId));
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<number, Product> = new Map();
  private retailers: Map<number, Retailer> = new Map();
  private prices: Map<number, Price> = new Map();
  private scanHistoryItems: Map<number, ScanHistory> = new Map();
  private favoritesItems: Map<number, Favorite> = new Map();
  private shoppingListItemsMap: Map<number, ShoppingListItem> = new Map();
  private chatMessagesMap: Map<number, ChatMessage> = new Map();
  
  private currentProductId = 1;
  private currentRetailerId = 1;
  private currentPriceId = 1;
  private currentScanHistoryId = 1;
  private currentFavoriteId = 1;
  private currentShoppingListId = 1;
  private currentChatMessageId = 1;

  constructor() {
    this.seedData();
  }

  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...existingUser,
      ...userData,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  private seedData() {
    // Seed retailers
    const targetRetailer: Retailer = { id: this.currentRetailerId++, name: "Target", logo: "T" };
    const walmartRetailer: Retailer = { id: this.currentRetailerId++, name: "Walmart", logo: "W" };
    const amazonRetailer: Retailer = { id: this.currentRetailerId++, name: "Amazon", logo: "A" };
    
    this.retailers.set(targetRetailer.id, targetRetailer);
    this.retailers.set(walmartRetailer.id, walmartRetailer);
    this.retailers.set(amazonRetailer.id, amazonRetailer);

    // No seed products - only use real data from barcode scanning
  }

  async getProductByBarcode(barcode: string): Promise<ProductWithPrices | undefined> {
    const product = Array.from(this.products.values()).find(p => p.barcode === barcode);
    if (!product) return undefined;

    const productPrices = Array.from(this.prices.values())
      .filter(p => p.productId === product.id)
      .map(price => ({
        ...price,
        retailer: this.retailers.get(price.retailerId)!
      }));

    return {
      ...product,
      prices: productPrices
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = { 
      id: this.currentProductId++, 
      ...product,
      brand: product.brand ?? null,
      description: product.description ?? null,
      imageUrl: product.imageUrl ?? null,
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      throw new Error(`Product with id ${id} not found`);
    }
    const updatedProduct: Product = { ...existingProduct, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getAllRetailers(): Promise<Retailer[]> {
    return Array.from(this.retailers.values());
  }

  async createRetailer(retailer: InsertRetailer): Promise<Retailer> {
    const newRetailer: Retailer = { 
      id: this.currentRetailerId++, 
      ...retailer,
      logo: retailer.logo ?? null,
    };
    this.retailers.set(newRetailer.id, newRetailer);
    return newRetailer;
  }

  async createPrice(price: InsertPrice): Promise<Price> {
    const newPrice: Price = { 
      id: this.currentPriceId++, 
      ...price,
      stock: price.stock ?? null,
      url: price.url ?? null,
    };
    this.prices.set(newPrice.id, newPrice);
    return newPrice;
  }

  async addScanHistory(scan: InsertScanHistory): Promise<ScanHistory> {
    const newScan: ScanHistory = {
      id: this.currentScanHistoryId++,
      ...scan,
      bestPrice: scan.bestPrice ?? null,
      scannedAt: new Date()
    };
    this.scanHistoryItems.set(newScan.id, newScan);
    return newScan;
  }

  async getScanHistory(): Promise<ScanHistory[]> {
    return Array.from(this.scanHistoryItems.values())
      .sort((a, b) => new Date(b.scannedAt!).getTime() - new Date(a.scannedAt!).getTime());
  }

  async clearScanHistory(): Promise<void> {
    this.scanHistoryItems.clear();
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const newFavorite: Favorite = {
      id: this.currentFavoriteId++,
      ...favorite,
      userId: favorite.userId ?? null,
      addedAt: new Date()
    };
    this.favoritesItems.set(newFavorite.id, newFavorite);
    return newFavorite;
  }

  async removeFavorite(productId: number): Promise<void> {
    const favorite = Array.from(this.favoritesItems.values()).find(f => f.productId === productId);
    if (favorite) {
      this.favoritesItems.delete(favorite.id);
    }
  }

  async getFavorites(): Promise<(Favorite & { product: ProductWithPrices })[]> {
    const favorites = Array.from(this.favoritesItems.values());
    const result = [];

    for (const favorite of favorites) {
      const product = this.products.get(favorite.productId);
      if (product) {
        const productPrices = Array.from(this.prices.values())
          .filter(p => p.productId === product.id)
          .map(price => ({
            ...price,
            retailer: this.retailers.get(price.retailerId)!
          }));

        result.push({
          ...favorite,
          product: {
            ...product,
            prices: productPrices
          }
        });
      }
    }

    return result;
  }

  async addShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const newItem: ShoppingListItem = {
      id: this.currentShoppingListId++,
      ...item,
      userId: item.userId ?? null,
      quantity: item.quantity ?? null,
      completed: item.completed ?? null,
      addedAt: new Date()
    };
    this.shoppingListItemsMap.set(newItem.id, newItem);
    return newItem;
  }

  async updateShoppingListItem(id: number, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem> {
    const item = this.shoppingListItemsMap.get(id);
    if (!item) throw new Error("Shopping list item not found");

    const updatedItem = { ...item, ...updates };
    this.shoppingListItemsMap.set(id, updatedItem);
    return updatedItem;
  }

  async removeShoppingListItem(id: number): Promise<void> {
    this.shoppingListItemsMap.delete(id);
  }

  async getShoppingList(): Promise<(ShoppingListItem & { product: ProductWithPrices })[]> {
    const items = Array.from(this.shoppingListItemsMap.values());
    const result = [];

    for (const item of items) {
      const product = this.products.get(item.productId);
      if (product) {
        const productPrices = Array.from(this.prices.values())
          .filter(p => p.productId === product.id)
          .map(price => ({
            ...price,
            retailer: this.retailers.get(price.retailerId)!
          }));

        result.push({
          ...item,
          product: {
            ...product,
            prices: productPrices
          }
        });
      }
    }

    return result;
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: this.currentChatMessageId++,
      ...message,
      timestamp: new Date(),
    };
    this.chatMessagesMap.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessagesMap.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  }

  async clearChatHistory(userId: string): Promise<void> {
    const messagesToDelete = Array.from(this.chatMessagesMap.entries())
      .filter(([_, message]) => message.userId === userId)
      .map(([id, _]) => id);
    
    messagesToDelete.forEach(id => {
      this.chatMessagesMap.delete(id);
    });
  }

  // Advertisement operations (mock implementation for development)
  async getActiveAds(placement: string): Promise<Advertisement[]> {
    // Return ads for the specified placement
    return [
      {
        id: 1,
        title: "Premium Shopping Assistant Pro",
        description: "Upgrade to Pro for advanced price tracking and notifications",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
        targetUrl: "https://example.com/upgrade",
        advertiser: "ShopSmart",
        adType: "banner",
        placement: placement,
        impressions: 150,
        clicks: 12,
        isActive: true,
        startDate: new Date(),
        endDate: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        title: "Eco-Friendly Product Finder",
        description: "Discover sustainable alternatives for all your shopping needs",
        imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400",
        targetUrl: "https://example.com/eco",
        advertiser: "GreenChoice",
        adType: "native",
        placement: placement,
        impressions: 89,
        clicks: 7,
        isActive: true,
        startDate: new Date(),
        endDate: null,
        createdAt: new Date(),
      }
    ];
  }

  async trackAdClick(click: InsertAdClick): Promise<AdClick> {
    const newClick: AdClick = {
      id: Math.floor(Math.random() * 10000),
      ...click,
      clickedAt: new Date(),
    };
    return newClick;
  }

  async incrementAdImpressions(adId: number): Promise<void> {
    // Mock implementation - in real app this would update ad impression count
    console.log(`Incremented impressions for ad ${adId}`);
  }
}

export const storage = new DatabaseStorage();
