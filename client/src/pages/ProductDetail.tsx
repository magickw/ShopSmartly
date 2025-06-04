import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, ShoppingCart, Leaf, BarChart3 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EcoFriendlyComparison from "@/components/EcoFriendlyComparison";
import MerchantPriceComparison from "@/components/MerchantPriceComparison";
import type { ScanResult } from "@shared/schema";

export default function ProductDetail() {
  const params = useParams<{ barcode: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: scanResult, isLoading } = useQuery<ScanResult>({
    queryKey: [`/api/scan`, params.barcode],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/scan", { barcode: params.barcode });
      return response.json();
    },
    enabled: !!params.barcode,
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!scanResult?.product) return;
      return apiRequest("POST", "/api/favorites", { productId: scanResult.product.id });
    },
    onSuccess: () => {
      toast({ title: "Added to favorites!" });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({ title: "Failed to add to favorites", variant: "destructive" });
    },
  });

  const addToShoppingListMutation = useMutation({
    mutationFn: async () => {
      if (!scanResult?.product) return;
      return apiRequest("POST", "/api/shopping-list", { 
        productId: scanResult.product.id,
        quantity: 1 
      });
    },
    onSuccess: () => {
      toast({ title: "Added to shopping list!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
    onError: () => {
      toast({ title: "Failed to add to shopping list", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-ios-blue mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Product Not Found</h1>
        </div>
        <p className="text-center text-gray-500">The scanned product was not found in our database.</p>
      </div>
    );
  }

  const { product } = scanResult;

  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-ios-blue mr-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Product Details</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-ios-red"
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      {/* Product Info */}
      <div className="px-4 py-6">
        {product.imageUrl && (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">{product.name}</h2>
          {product.brand && (
            <p className="text-ios-gray mb-2">{product.brand}</p>
          )}
          {product.description && (
            <p className="text-sm text-ios-gray">{product.description}</p>
          )}
        </div>

        {/* Merchant Price Comparison */}
        <MerchantPriceComparison product={product} className="mb-6" />

        {/* Eco-Friendly Comparison */}
        <EcoFriendlyComparison product={product} className="mb-6" />

        {/* Eco-Friendly Actions */}
        {(product.ecoScore || product.isEcoFriendly || product.sustainabilityCertifications?.length) && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Environmental Impact Actions
              </h3>
              <div className="space-y-2 text-sm text-green-700 mb-4">
                <p>• Compare with similar eco-friendly products</p>
                {product.recyclingInfo && (
                  <p>• Recyclable - check local recycling guidelines</p>
                )}
                {product.carbonFootprint && (
                  <p>• Carbon footprint: {product.carbonFootprint}</p>
                )}
                {product.sustainabilityCertifications && product.sustainabilityCertifications.length > 0 && (
                  <p>• {product.sustainabilityCertifications.length} sustainability certification(s)</p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-green-300 text-green-700 hover:bg-green-100"
                onClick={() => setLocation("/eco-comparison")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Compare Eco Products
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => addToFavoritesMutation.mutate()}
            disabled={addToFavoritesMutation.isPending}
            className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white py-4 rounded-xl font-medium h-auto"
          >
            <Heart className="mr-2 h-5 w-5" />
            Add to Favorites
          </Button>
          <Button
            onClick={() => addToShoppingListMutation.mutate()}
            disabled={addToShoppingListMutation.isPending}
            className="w-full bg-ios-green hover:bg-ios-green/90 text-white py-4 rounded-xl font-medium h-auto"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Shopping List
          </Button>
        </div>
      </div>
    </div>
  );
}
