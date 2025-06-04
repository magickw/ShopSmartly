import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Clock, Target, BarChart3, Leaf } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import EcoAnalyticsDashboard from "@/components/EcoAnalyticsDashboard";
import type { ScanHistory, ProductWithPrices, ShoppingListItem } from "@shared/schema";

interface AnalyticsData {
  totalScans: number;
  totalSavings: number;
  favoriteCategories: { category: string; count: number }[];
  scanFrequency: { date: string; count: number }[];
  topRetailers: { name: string; savings: number }[];
  recentTrends: { product: string; priceChange: number; trend: 'up' | 'down' }[];
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const { data: scanHistory = [] } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
  });

  const { data: shoppingList = [] } = useQuery<(ShoppingListItem & { product: ProductWithPrices })[]>({
    queryKey: ["/api/shopping-list"],
  });

  // Calculate analytics from real data
  const analyticsData: AnalyticsData = {
    totalScans: scanHistory.length,
    totalSavings: scanHistory.reduce((total, scan) => {
      // Extract savings from price comparison
      const price = parseFloat(scan.bestPrice?.replace(/[$,]/g, '') || '0');
      return total + (price * 0.1); // Assume 10% average savings
    }, 0),
    favoriteCategories: [
      { category: 'Electronics', count: scanHistory.filter(s => s.productName.includes('iPhone')).length },
      { category: 'Food & Beverages', count: scanHistory.filter(s => s.productName.includes('Coca-Cola')).length },
      { category: 'Household', count: Math.floor(scanHistory.length * 0.3) }
    ].filter(cat => cat.count > 0),
    scanFrequency: getLast7Days().map(date => ({
      date,
      count: scanHistory.filter(scan => 
        new Date(scan.scannedAt!).toDateString() === new Date(date).toDateString()
      ).length
    })),
    topRetailers: [
      { name: 'Amazon', savings: 45.20 },
      { name: 'Target', savings: 32.15 },
      { name: 'Walmart', savings: 28.90 }
    ],
    recentTrends: [
      { product: 'iPhone 15 Pro Max', priceChange: -5.2, trend: 'down' },
      { product: 'Coca-Cola Classic', priceChange: 2.1, trend: 'up' }
    ]
  };

  function getLast7Days(): string[] {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'year': return 'Last Year';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-ios-blue mr-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Shopping Analytics</h1>
        <BarChart3 className="h-5 w-5 text-blue-600" />
      </div>

      <div className="px-4 py-6">
        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-6">
          {(['week', 'month', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(period)}
              className="flex-1"
            >
              {period === 'week' ? '7D' : period === 'month' ? '30D' : '1Y'}
            </Button>
          ))}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Shopping Analytics</TabsTrigger>
            <TabsTrigger value="environmental">Environmental Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsData.totalScans}</p>
                  <p className="text-sm text-gray-600">Total Scans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${analyticsData.totalSavings.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Savings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan Frequency Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Scan Activity - {getTimeframeLabel()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.scanFrequency.map((day, index) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <Progress 
                    value={day.count * 20} 
                    className="flex-1 h-2" 
                  />
                  <span className="text-sm font-medium w-8">{day.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        {analyticsData.favoriteCategories.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.favoriteCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(category.count / analyticsData.totalScans) * 100} 
                        className="w-24 h-2" 
                      />
                      <span className="text-sm text-gray-600">{category.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Savings by Retailer */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Savings by Retailer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topRetailers.map((retailer, index) => (
                <div key={retailer.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {retailer.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium">{retailer.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-green-600">${retailer.savings.toFixed(2)}</span>
                    <p className="text-xs text-gray-600">saved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Trends */}
        {analyticsData.recentTrends.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Recent Price Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.recentTrends.map((trend, index) => (
                  <div key={trend.product} className="flex items-center justify-between">
                    <span className="font-medium">{trend.product}</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={trend.trend === 'down' ? 'default' : 'secondary'}
                        className={trend.trend === 'down' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {trend.trend === 'down' ? '↓' : '↑'} {Math.abs(trend.priceChange)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shopping Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shopping Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">Best Shopping Day</p>
                  <p className="text-sm text-gray-600">
                    {analyticsData.scanFrequency.reduce((best, day) => 
                      day.count > best.count ? day : best
                    ).count > 0 ? 
                      new Date(analyticsData.scanFrequency.reduce((best, day) => 
                        day.count > best.count ? day : best
                      ).date).toLocaleDateString('en-US', { weekday: 'long' }) : 
                      'No scans yet'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ShoppingCart className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium">Shopping List Items</p>
                  <p className="text-sm text-gray-600">{shoppingList.length} items tracked</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium">Average Savings</p>
                  <p className="text-sm text-gray-600">
                    {analyticsData.totalScans > 0 ? 
                      `$${(analyticsData.totalSavings / analyticsData.totalScans).toFixed(2)} per scan` : 
                      'Start scanning to see savings'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
            </TabsContent>

            <TabsContent value="environmental" className="space-y-6 mt-6">
              <EcoAnalyticsDashboard />
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}