import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem, ProductWithPrices } from "@shared/schema";

type ShoppingListItemWithProduct = ShoppingListItem & { product: ProductWithPrices };

export default function ShoppingList() {
  const { toast } = useToast();

  const { data: shoppingList = [], isLoading } = useQuery<ShoppingListItemWithProduct[]>({
    queryKey: ["/api/shopping-list"],
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ShoppingListItem> }) => {
      return apiRequest("PATCH", `/api/shopping-list/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/shopping-list/${id}`, undefined);
    },
    onSuccess: () => {
      toast({ title: "Item removed from shopping list!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
    onError: () => {
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      const completedItems = shoppingList.filter(item => item.completed);
      await Promise.all(
        completedItems.map(item => 
          apiRequest("DELETE", `/api/shopping-list/${item.id}`, undefined)
        )
      );
    },
    onSuccess: () => {
      toast({ title: "Completed items cleared!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
    onError: () => {
      toast({ title: "Failed to clear completed items", variant: "destructive" });
    },
  });

  const handleToggleCompleted = (item: ShoppingListItemWithProduct) => {
    updateItemMutation.mutate({
      id: item.id,
      updates: { completed: !item.completed }
    });
  };

  const getEstimatedPrice = (product: ProductWithPrices) => {
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
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <h1 className="text-2xl font-bold">Shopping List</h1>
        {shoppingList.some(item => item.completed) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearCompletedMutation.mutate()}
            disabled={clearCompletedMutation.isPending}
            className="text-ios-blue"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="mt-6">
        {shoppingList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Your shopping list is empty</p>
            <p className="text-sm text-gray-400 mt-2">
              Scan products and add them to your list
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shoppingList.map((item) => (
              <Card key={item.id} className="bg-white border border-gray-100">
                <CardContent className="p-4 flex items-center">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => handleToggleCompleted(item)}
                    className="mr-4 h-5 w-5"
                  />
                  <div className="flex-1">
                    <h3 className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-ios-gray">
                      Est. {getEstimatedPrice(item.product)}
                    </p>
                  </div>
                  <span className="text-xs bg-ios-light-gray px-2 py-1 rounded-full">
                    {item.quantity}x
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Button */}
      <div className="fixed bottom-24 right-4">
        <Button
          size="icon"
          className="w-14 h-14 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
