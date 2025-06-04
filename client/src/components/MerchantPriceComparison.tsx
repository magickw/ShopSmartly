import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, ExternalLink, TrendingDown, TrendingUp, 
  Store, ShoppingCart, AlertCircle, CheckCircle 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithPrices } from "@shared/schema";

interface MerchantPriceComparisonProps {
  product: ProductWithPrices;
  className?: string;
}

export default function MerchantPriceComparison({ product, className }: MerchantPriceComparisonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      const response = await apiRequest("POST", `/api/products/${product.barcode}/refresh-prices`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Prices Updated",
        description: data.message || "Merchant prices have been refreshed",
      });
      // Invalidate and refetch product data
      queryClient.invalidateQueries({ queryKey: ["/api/scan"] });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh merchant prices",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    }
  });

  const getPriceValue = (priceString: string): number => {
    return parseFloat(priceString.replace(/[^0-9.]/g, ''));
  };

  const getLowestPrice = () => {
    if (!product.prices || product.prices.length === 0) return null;
    return product.prices.reduce((lowest, current) => 
      getPriceValue(current.price) < getPriceValue(lowest.price) ? current : lowest
    );
  };

  const getHighestPrice = () => {
    if (!product.prices || product.prices.length === 0) return null;
    return product.prices.reduce((highest, current) => 
      getPriceValue(current.price) > getPriceValue(highest.price) ? current : highest
    );
  };

  const calculateSavings = () => {
    const lowest = getLowestPrice();
    const highest = getHighestPrice();
    if (!lowest || !highest) return 0;
    return getPriceValue(highest.price) - getPriceValue(lowest.price);
  };

  const getStockStatus = (stock: string) => {
    const stockLower = stock.toLowerCase();
    if (stockLower.includes('in stock')) {
      return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" };
    } else if (stockLower.includes('out of stock')) {
      return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" };
    } else {
      return { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-100" };
    }
  };

  const getRetailerLogo = (retailerName: string) => {
    const logos: Record<string, string> = {
      'Amazon': '🛒',
      'Walmart': '🏪',
      'Target': '🎯',
      'Best Buy': '💻',
      'CVS': '💊',
      'Walgreens': '🏥',
      'Costco': '📦',
      'Home Depot': '🔨',
      'Lowe\'s': '🏠'
    };
    return logos[retailerName] || '🏬';
  };

  if (!product.prices || product.prices.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Merchant Price Comparison
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshPricesMutation.mutate()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Get Prices
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No merchant pricing data available</p>
            <p className="text-sm text-gray-400 mb-4">
              Click "Get Prices" to fetch real-time pricing from multiple retailers
            </p>
            <div className="text-xs text-gray-400">
              <p>Supported APIs:</p>
              <p>• Shopping.com • Google Shopping • Keepa (Amazon)</p>
              <p>• PriceAPI • Target • Walmart</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lowestPrice = getLowestPrice();
  const savings = calculateSavings();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Merchant Price Comparison
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshPricesMutation.mutate()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Summary */}
        {savings > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800">Potential Savings</h3>
                <p className="text-sm text-green-600">
                  Save up to ${savings.toFixed(2)} by choosing the best price
                </p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${savings.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Merchant Prices */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Prices by Merchant ({product.prices.length})
          </h3>
          
          {product.prices
            .sort((a, b) => getPriceValue(a.price) - getPriceValue(b.price))
            .map((priceInfo, index) => {
              const isLowest = lowestPrice && priceInfo.id === lowestPrice.id;
              const stockStatus = getStockStatus(priceInfo.stock || '');
              const StockIcon = stockStatus.icon;
              
              return (
                <div 
                  key={priceInfo.id} 
                  className={`border rounded-lg p-4 ${isLowest ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getRetailerLogo(priceInfo.retailer.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{priceInfo.retailer.name}</h4>
                          {isLowest && (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Best Price
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StockIcon className={`h-4 w-4 ${stockStatus.color}`} />
                          <span className="text-sm text-gray-600">{priceInfo.stock}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-bold ${isLowest ? 'text-green-600' : 'text-gray-900'}`}>
                        {priceInfo.price}
                      </div>
                      {priceInfo.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(priceInfo.url!, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <Separator />

        {/* Price Analysis */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-semibold">Lowest Price</div>
            <div className="text-green-600 font-bold">
              {lowestPrice ? lowestPrice.price : 'N/A'}
            </div>
            {lowestPrice && (
              <div className="text-xs text-gray-600">{lowestPrice.retailer.name}</div>
            )}
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-semibold">Average Price</div>
            <div className="text-blue-600 font-bold">
              ${product.prices.length > 0 ? 
                (product.prices.reduce((sum, p) => sum + getPriceValue(p.price), 0) / product.prices.length).toFixed(2) 
                : '0.00'}
            </div>
            <div className="text-xs text-gray-600">Across {product.prices.length} merchants</div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Price data sources:</p>
          <p>Real-time pricing from merchant APIs and authorized databases. Prices may vary and are subject to change.</p>
        </div>
      </CardContent>
    </Card>
  );
}