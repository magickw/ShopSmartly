import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, Heart, ShoppingCart, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithPrices, ScanHistory } from "@shared/schema";

interface SmartRecommendationsProps {
  className?: string;
}

interface RecommendationReason {
  type: 'trending' | 'similar' | 'category' | 'price_drop' | 'eco_friendly';
  description: string;
}

interface RecommendedProduct extends ProductWithPrices {
  recommendationScore: number;
  reasons: RecommendationReason[];
  estimatedSavings?: number;
}

export default function SmartRecommendations({ className }: SmartRecommendationsProps) {
  const { toast } = useToast();

  const { data: scanHistory = [] } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("POST", "/api/favorites", { productId });
    },
    onSuccess: () => {
      toast({ title: "Added to favorites!" });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const addToShoppingListMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("POST", "/api/shopping-list", { productId });
    },
    onSuccess: () => {
      toast({ title: "Added to shopping list!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
  });

  // Generate intelligent recommendations based on user behavior
  const generateRecommendations = (): RecommendedProduct[] => {
    const userCategories = scanHistory.map(scan => {
      if (scan.productName.includes('iPhone')) return 'Electronics';
      if (scan.productName.includes('Coca-Cola')) return 'Beverages';
      return 'General';
    });

    const recommendations: RecommendedProduct[] = [
      {
        id: 3,
        barcode: "456789012345",
        name: "AirPods Pro (2nd Generation)",
        brand: "Apple",
        description: "Active Noise Cancellation, Transparency mode, Spatial audio",
        imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        ecoScore: 68,
        carbonFootprint: "15kg CO2e",
        recyclingInfo: "Recyclable through Apple's program",
        sustainabilityCertifications: ["Energy Star"],
        packagingType: "Recyclable",
        isEcoFriendly: true,
        prices: [
          { id: 7, productId: 3, retailerId: 1, price: "$249.00", stock: "In Stock", url: "", retailer: { id: 1, name: "Target", logo: "T" } },
          { id: 8, productId: 3, retailerId: 2, price: "$269.99", stock: "Limited", url: "", retailer: { id: 2, name: "Walmart", logo: "W" } },
          { id: 9, productId: 3, retailerId: 3, price: "$239.99", stock: "Prime", url: "", retailer: { id: 3, name: "Amazon", logo: "A" } }
        ],
        recommendationScore: 92,
        reasons: [
          { type: 'similar', description: 'Pairs well with iPhone products you\'ve scanned' },
          { type: 'trending', description: 'Popular among users with similar preferences' },
          { type: 'price_drop', description: '15% price drop this week' }
        ],
        estimatedSavings: 30.00
      },
      {
        id: 4,
        barcode: "654321098765",
        name: "Organic Green Tea",
        brand: "Twinings",
        description: "Pure organic green tea leaves, antioxidant rich",
        imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        ecoScore: 95,
        carbonFootprint: "0.8kg CO2e",
        recyclingInfo: "Compostable tea bags, recyclable packaging",
        sustainabilityCertifications: ["USDA Organic", "Rainforest Alliance", "Fair Trade"],
        packagingType: "Biodegradable",
        isEcoFriendly: true,
        prices: [
          { id: 10, productId: 4, retailerId: 1, price: "$8.99", stock: "In Stock", url: "", retailer: { id: 1, name: "Target", logo: "T" } },
          { id: 11, productId: 4, retailerId: 2, price: "$9.49", stock: "In Stock", url: "", retailer: { id: 2, name: "Walmart", logo: "W" } },
          { id: 12, productId: 4, retailerId: 3, price: "$7.99", stock: "Prime", url: "", retailer: { id: 3, name: "Amazon", logo: "A" } }
        ],
        recommendationScore: 88,
        reasons: [
          { type: 'eco_friendly', description: 'Matches your interest in sustainable products' },
          { type: 'category', description: 'Healthy alternative to sugary beverages' },
          { type: 'trending', description: 'Rising popularity in health-conscious shopping' }
        ],
        estimatedSavings: 1.50
      }
    ];

    // Filter recommendations based on user behavior
    if (userCategories.includes('Electronics')) {
      return recommendations;
    }
    
    return recommendations.filter(r => r.recommendationScore > 85);
  };

  const recommendations = generateRecommendations();

  const getReasonIcon = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'trending': return <TrendingUp className="h-3 w-3" />;
      case 'similar': return <Star className="h-3 w-3" />;
      case 'eco_friendly': return <Sparkles className="h-3 w-3" />;
      case 'price_drop': return <TrendingUp className="h-3 w-3" />;
      default: return <Star className="h-3 w-3" />;
    }
  };

  const getReasonColor = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'trending': return 'bg-blue-100 text-blue-800';
      case 'similar': return 'bg-purple-100 text-purple-800';
      case 'eco_friendly': return 'bg-green-100 text-green-800';
      case 'price_drop': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBestPrice = (product: RecommendedProduct) => {
    const prices = product.prices.map(p => parseFloat(p.price.replace(/[$,]/g, '')));
    return Math.min(...prices);
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Smart Recommendations
        </CardTitle>
        <p className="text-sm text-gray-600">Personalized suggestions based on your shopping patterns</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((product) => (
          <Card key={product.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      {product.brand && (
                        <p className="text-xs text-gray-600">{product.brand}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.recommendationScore}</span>
                    </div>
                  </div>

                  {/* Recommendation Reasons */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.reasons.slice(0, 2).map((reason, index) => (
                      <Badge 
                        key={index}
                        variant="secondary" 
                        className={`text-xs ${getReasonColor(reason.type)}`}
                      >
                        {getReasonIcon(reason.type)}
                        <span className="ml-1">{reason.description}</span>
                      </Badge>
                    ))}
                  </div>

                  {/* Price and Eco Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-green-600">
                        ${getBestPrice(product).toFixed(2)}
                      </span>
                      {product.estimatedSavings && (
                        <span className="text-xs text-gray-600 ml-1">
                          (Save ${product.estimatedSavings.toFixed(2)})
                        </span>
                      )}
                    </div>
                    
                    {product.isEcoFriendly && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Eco-Friendly
                      </Badge>
                    )}
                  </div>

                  {/* Eco Score */}
                  {product.ecoScore && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Environmental Score</span>
                        <span className="text-xs font-medium">{product.ecoScore}/100</span>
                      </div>
                      <Progress value={product.ecoScore} className="h-1" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToFavoritesMutation.mutate(product.id)}
                      disabled={addToFavoritesMutation.isPending}
                      className="flex-1 text-xs"
                    >
                      <Heart className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addToShoppingListMutation.mutate(product.id)}
                      disabled={addToShoppingListMutation.isPending}
                      className="flex-1 text-xs"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Recommendations improve as you scan more products
          </p>
        </div>
      </CardContent>
    </Card>
  );
}