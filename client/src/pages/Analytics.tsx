import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Users, Target, Crown, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import type { RevenueAnalytics } from "@shared/schema";

export default function Analytics() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("30");
  const [showSubscriptions, setShowSubscriptions] = useState(false);

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["/api/analytics/revenue", timeRange],
    enabled: !!user && subscriptionStatus?.tier !== "free",
    retry: false,
  });

  if (authLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasAnalyticsAccess = subscriptionStatus?.tier === "premium" || subscriptionStatus?.tier === "business";

  if (!hasAnalyticsAccess) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Premium Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get detailed insights into revenue, conversions, and business performance with our premium analytics dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Badge variant="outline" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Premium Feature
            </Badge>
            <span className="text-sm text-gray-500">
              Current plan: {subscriptionStatus?.tier || "Free"}
            </span>
          </div>

          <Button 
            onClick={() => setShowSubscriptions(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>

        {showSubscriptions && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6 text-center">Choose Your Plan</h2>
            <SubscriptionPlans 
              currentPlan={subscriptionStatus?.tier || "free"}
              onPlanSelect={() => {
                toast({
                  title: "Plan Updated",
                  description: "Your subscription has been updated successfully.",
                });
                setShowSubscriptions(false);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-red-500">Failed to load analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Revenue insights and business performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="flex items-center gap-2">
            <Crown className="h-3 w-3" />
            {subscriptionStatus?.tier}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.totalRevenue}</div>
                <p className="text-xs text-muted-foreground">
                  Last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeSubscribers}</div>
                <p className="text-xs text-muted-foreground">
                  Premium & Business plans
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Affiliate clicks to sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Revenue/User</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.averageRevenuePerUser}</div>
                <p className="text-xs text-muted-foreground">
                  Per active subscriber
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subscriptions</span>
                  <span className="font-semibold">${analytics.subscriptionRevenue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Affiliate Commissions</span>
                  <span className="font-semibold">${analytics.affiliateRevenue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Advertisements</span>
                  <span className="font-semibold">${analytics.adRevenue}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span>${analytics.totalRevenue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Affiliate Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topAffiliatePartners.map((partner, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{partner.retailer}</div>
                        <div className="text-xs text-gray-500">
                          {partner.clicks} clicks • {partner.conversions} conversions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${partner.revenue}</div>
                        <div className="text-xs text-gray-500">
                          {partner.conversions > 0 ? ((partner.conversions / partner.clicks) * 100).toFixed(1) : 0}% CVR
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.topAffiliatePartners.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No affiliate data available yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      )}
    </div>
  );
}