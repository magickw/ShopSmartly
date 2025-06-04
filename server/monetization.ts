import { storage } from "./storage";
import type { 
  User, 
  AffiliateClick, 
  InsertAffiliateClick, 
  SubscriptionPayment,
  InsertSubscriptionPayment,
  RevenueMetric,
  InsertRevenueMetric,
  FeatureUsage,
  InsertFeatureUsage,
  SubscriptionPlan,
  RevenueAnalytics,
  Retailer,
  Product
} from "@shared/schema";

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "0.00",
    currency: "USD",
    interval: "month",
    features: [
      "10 scans per day",
      "Basic price comparison",
      "Scan history (7 days)",
      "Community support"
    ],
    dailyScanLimit: 10,
    priceAlerts: false,
    bulkScanning: false,
    analytics: false,
    apiAccess: false
  },
  {
    id: "premium",
    name: "Premium",
    price: "4.99",
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited scans",
      "Price alerts & notifications",
      "Advanced analytics",
      "Extended scan history (90 days)",
      "Priority support",
      "Export data"
    ],
    priceAlerts: true,
    bulkScanning: true,
    analytics: true,
    apiAccess: false
  },
  {
    id: "business",
    name: "Business",
    price: "19.99",
    currency: "USD",
    interval: "month",
    features: [
      "Everything in Premium",
      "API access (1000 calls/month)",
      "Bulk scanning tools",
      "Team collaboration",
      "Custom integrations",
      "Dedicated support"
    ],
    priceAlerts: true,
    bulkScanning: true,
    analytics: true,
    apiAccess: true
  }
];

export class MonetizationService {
  
  // Subscription management
  async checkSubscriptionStatus(userId: string): Promise<{
    isActive: boolean;
    tier: string;
    expiresAt?: Date;
    daysRemaining?: number;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { isActive: false, tier: "free" };
    }

    const now = new Date();
    const subscriptionTier = user.subscriptionTier || "free";
    
    if (subscriptionTier === "free") {
      return { isActive: true, tier: "free" };
    }

    const expiresAt = user.subscriptionExpiresAt;
    if (!expiresAt || expiresAt < now) {
      // Subscription expired, downgrade to free
      await storage.updateUserSubscription(userId, {
        subscriptionTier: "free",
        subscriptionExpiresAt: null
      });
      return { isActive: false, tier: "free" };
    }

    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isActive: true,
      tier: subscriptionTier,
      expiresAt,
      daysRemaining
    };
  }

  async checkScanLimit(userId: string): Promise<{
    canScan: boolean;
    scansUsed: number;
    scansRemaining: number;
    resetTime?: Date;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { canScan: false, scansUsed: 0, scansRemaining: 0 };
    }

    const subscriptionStatus = await this.checkSubscriptionStatus(userId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionStatus.tier);
    
    // Premium and business users have unlimited scans
    if (!plan?.dailyScanLimit) {
      return { canScan: true, scansUsed: 0, scansRemaining: -1 };
    }

    // Check if we need to reset daily count
    const now = new Date();
    const lastReset = user.lastScanResetDate || new Date();
    const shouldReset = now.toDateString() !== lastReset.toDateString();

    if (shouldReset) {
      await storage.resetDailyScanCount(userId);
      return { 
        canScan: true, 
        scansUsed: 0, 
        scansRemaining: plan.dailyScanLimit,
        resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const scansUsed = user.dailyScansCount || 0;
    const scansRemaining = Math.max(0, plan.dailyScanLimit - scansUsed);
    
    return {
      canScan: scansRemaining > 0,
      scansUsed,
      scansRemaining,
      resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    };
  }

  async incrementScanCount(userId: string): Promise<void> {
    await storage.incrementDailyScanCount(userId);
  }

  // Affiliate marketing
  async generateAffiliateUrl(
    userId: string | null,
    productId: number,
    retailerId: number,
    originalUrl: string
  ): Promise<string> {
    const retailer = await storage.getRetailerById(retailerId);
    
    // If retailer doesn't have affiliate program, return original URL
    if (!retailer?.affiliateProgram || !retailer.affiliateBaseUrl) {
      return originalUrl;
    }

    // Track the affiliate click
    const affiliateClick: InsertAffiliateClick = {
      userId,
      productId,
      retailerId,
      affiliateUrl: originalUrl,
      commissionRate: retailer.affiliateCommissionRate || "0%",
      estimatedCommission: "0.00"
    };

    await storage.trackAffiliateClick(affiliateClick);

    // Generate affiliate URL (simplified - in production, integrate with actual affiliate networks)
    const affiliateParams = new URLSearchParams({
      ref: 'pricescan',
      uid: userId || 'anonymous',
      pid: productId.toString()
    });

    return `${retailer.affiliateBaseUrl}?${affiliateParams.toString()}&url=${encodeURIComponent(originalUrl)}`;
  }

  async trackAffiliateConversion(affiliateClickId: number, orderValue: string): Promise<void> {
    const click = await storage.getAffiliateClick(affiliateClickId);
    if (!click) return;

    const commissionRate = parseFloat(click.commissionRate?.replace('%', '') || '0') / 100;
    const orderAmount = parseFloat(orderValue);
    const commission = (orderAmount * commissionRate).toFixed(2);

    await storage.updateAffiliateClick(affiliateClickId, {
      conversionTracked: true,
      actualCommission: commission
    });

    // Update revenue metrics
    await this.updateDailyRevenue(new Date(), {
      affiliateRevenue: commission
    });
  }

  // Revenue analytics
  async updateDailyRevenue(date: Date, revenue: {
    affiliateRevenue?: string;
    subscriptionRevenue?: string;
    adRevenue?: string;
  }): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    const existing = await storage.getRevenueMetricsByDate(dateStr);

    if (existing) {
      const updatedRevenue = {
        affiliateRevenue: (
          parseFloat(existing.affiliateRevenue || '0') + 
          parseFloat(revenue.affiliateRevenue || '0')
        ).toFixed(2),
        subscriptionRevenue: (
          parseFloat(existing.subscriptionRevenue || '0') + 
          parseFloat(revenue.subscriptionRevenue || '0')
        ).toFixed(2),
        adRevenue: (
          parseFloat(existing.adRevenue || '0') + 
          parseFloat(revenue.adRevenue || '0')
        ).toFixed(2)
      };

      updatedRevenue.totalRevenue = (
        parseFloat(updatedRevenue.affiliateRevenue) +
        parseFloat(updatedRevenue.subscriptionRevenue) +
        parseFloat(updatedRevenue.adRevenue)
      ).toFixed(2);

      await storage.updateRevenueMetrics(existing.id, updatedRevenue);
    } else {
      const totalRevenue = (
        parseFloat(revenue.affiliateRevenue || '0') +
        parseFloat(revenue.subscriptionRevenue || '0') +
        parseFloat(revenue.adRevenue || '0')
      ).toFixed(2);

      const newMetric: InsertRevenueMetric = {
        date,
        affiliateRevenue: revenue.affiliateRevenue || '0.00',
        subscriptionRevenue: revenue.subscriptionRevenue || '0.00',
        adRevenue: revenue.adRevenue || '0.00',
        totalRevenue
      };

      await storage.createRevenueMetric(newMetric);
    }
  }

  async getRevenueAnalytics(days: number = 30): Promise<RevenueAnalytics> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const metrics = await storage.getRevenueMetricsRange(startDate, endDate);
    const affiliateClicks = await storage.getAffiliateClicksRange(startDate, endDate);
    const activeSubscribers = await storage.getActiveSubscribersCount();

    const totals = metrics.reduce((acc, metric) => ({
      totalRevenue: acc.totalRevenue + parseFloat(metric.totalRevenue || '0'),
      affiliateRevenue: acc.affiliateRevenue + parseFloat(metric.affiliateRevenue || '0'),
      subscriptionRevenue: acc.subscriptionRevenue + parseFloat(metric.subscriptionRevenue || '0'),
      adRevenue: acc.adRevenue + parseFloat(metric.adRevenue || '0')
    }), { totalRevenue: 0, affiliateRevenue: 0, subscriptionRevenue: 0, adRevenue: 0 });

    const totalClicks = affiliateClicks.length;
    const conversions = affiliateClicks.filter(click => click.conversionTracked).length;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    // Calculate top affiliate partners
    const retailerStats = affiliateClicks.reduce((acc, click) => {
      const retailerId = click.retailerId;
      if (!acc[retailerId]) {
        acc[retailerId] = { clicks: 0, conversions: 0, revenue: 0 };
      }
      acc[retailerId].clicks++;
      if (click.conversionTracked) {
        acc[retailerId].conversions++;
        acc[retailerId].revenue += parseFloat(click.actualCommission || '0');
      }
      return acc;
    }, {} as Record<number, { clicks: number; conversions: number; revenue: number; }>);

    const topAffiliatePartners = await Promise.all(
      Object.entries(retailerStats)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(async ([retailerId, stats]) => {
          const retailer = await storage.getRetailerById(parseInt(retailerId));
          return {
            retailer: retailer?.name || 'Unknown',
            clicks: stats.clicks,
            conversions: stats.conversions,
            revenue: stats.revenue.toFixed(2)
          };
        })
    );

    const averageRevenuePerUser = activeSubscribers > 0 
      ? (totals.totalRevenue / activeSubscribers).toFixed(2)
      : '0.00';

    return {
      totalRevenue: totals.totalRevenue.toFixed(2),
      affiliateRevenue: totals.affiliateRevenue.toFixed(2),
      subscriptionRevenue: totals.subscriptionRevenue.toFixed(2),
      adRevenue: totals.adRevenue.toFixed(2),
      activeSubscribers,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      averageRevenuePerUser,
      topAffiliatePartners
    };
  }

  // Feature usage tracking
  async trackFeatureUsage(userId: string, feature: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    const usage: InsertFeatureUsage = {
      userId,
      feature,
      subscriptionTierAtUsage: user.subscriptionTier || 'free'
    };

    await storage.trackFeatureUsage(usage);
  }

  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscriptionStatus = await this.checkSubscriptionStatus(userId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionStatus.tier);
    
    if (!plan) return false;

    switch (feature) {
      case 'price_alerts':
        return plan.priceAlerts;
      case 'bulk_scanning':
        return plan.bulkScanning;
      case 'analytics':
        return plan.analytics;
      case 'api_access':
        return plan.apiAccess;
      default:
        return true; // Basic features available to all
    }
  }
}

export const monetizationService = new MonetizationService();