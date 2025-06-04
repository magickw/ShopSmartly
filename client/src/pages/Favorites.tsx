import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Favorite, ProductWithPrices } from "@shared/schema";

type FavoriteWithProduct = Favorite & { product: ProductWithPrices };

export default function Favorites() {
  const { toast } = useToast();

  const { data: favorites = [], isLoading } = useQuery<FavoriteWithProduct[]>({
    queryKey: ["/api/favorites"],
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("DELETE", `/api/favorites/${productId}`, undefined);
    },
    onSuccess: () => {
      toast({ title: "Removed from favorites!" });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({ title: "Failed to remove from favorites", variant: "destructive" });
    },
  });

  const getBestPrice = (product: ProductWithPrices) => {
    if (product.prices.length === 0) return "N/A";
    const bestPrice = product.prices.reduce((min, current) => {
      const currentPrice = parseFloat(current.price.replace('$', ''));
      const minPrice = parseFloat(min.price.replace('$', ''));
      return currentPrice < minPrice ? current : min;
    });
    return bestPrice.price;
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="py-3 border-b border-gray-100">
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      <div className="mt-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No favorites yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Scan products and add them to your favorites
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="bg-white border border-gray-100">
                <CardContent className="p-4 flex items-center">
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center mr-4">
                    {favorite.product.imageUrl ? (
                      <img 
                        src={favorite.product.imageUrl}
                        alt={favorite.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-500">IMG</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{favorite.product.name}</h3>
                    <p className="text-sm text-ios-gray">
                      Best Price: {getBestPrice(favorite.product)}
                    </p>
                    <p className="text-xs text-ios-gray">
                      Added {new Date(favorite.addedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFavoriteMutation.mutate(favorite.product.id)}
                    disabled={removeFavoriteMutation.isPending}
                    className="text-ios-red p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
