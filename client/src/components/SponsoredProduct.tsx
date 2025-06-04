import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SponsoredProductData {
  id: number;
  name: string;
  brand: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  features: string[];
  advertiser: string;
  targetUrl?: string;
}

interface SponsoredProductProps {
  product: SponsoredProductData;
  adId: number;
  className?: string;
}

export default function SponsoredProduct({ product, adId, className }: SponsoredProductProps) {
  const { toast } = useToast();

  const trackClickMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ads/click", { 
        advertisementId: adId,
        userAgent: navigator.userAgent 
      });
    },
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      trackClickMutation.mutate();
      return apiRequest("POST", "/api/favorites", { productId: product.id });
    },
    onSuccess: () => {
      toast({ title: "Added to favorites!" });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const addToShoppingListMutation = useMutation({
    mutationFn: async () => {
      trackClickMutation.mutate();
      return apiRequest("POST", "/api/shopping-list", { productId: product.id });
    },
    onSuccess: () => {
      toast({ title: "Added to shopping list!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
  });

  const handleProductClick = () => {
    trackClickMutation.mutate();
    if (product.targetUrl) {
      window.open(product.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((parseFloat(product.originalPrice.replace('$', '')) - parseFloat(product.price.replace('$', ''))) / parseFloat(product.originalPrice.replace('$', ''))) * 100)
    : 0;

  return (
    <Card className={`relative overflow-hidden border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 ${className}`}>
      <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 z-10">
        Sponsored
      </Badge>
      
      <CardContent className="p-4">
        <div className="cursor-pointer" onClick={handleProductClick}>
          <div className="relative mb-4">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-40 object-cover rounded-lg"
            />
            {discountPercentage > 0 && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                -{discountPercentage}%
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.brand}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">({product.reviewCount})</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-600">{product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
              )}
            </div>
            
            {product.features.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Key Features:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {product.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 pt-4 border-t border-yellow-200">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              addToFavoritesMutation.mutate();
            }}
            disabled={addToFavoritesMutation.isPending}
            className="flex-1"
          >
            <Heart className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              addToShoppingListMutation.mutate();
            }}
            disabled={addToShoppingListMutation.isPending}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to List
          </Button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <p className="text-xs text-gray-500 text-center">
            Sponsored by {product.advertiser}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}