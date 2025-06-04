import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit3, Trash2, Check, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem, ProductWithPrices, InsertProduct } from "@shared/schema";

type ShoppingListItemWithProduct = ShoppingListItem & { product: ProductWithPrices };

export default function ShoppingList() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemBrand, setNewItemBrand] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState("");
  
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState("");

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

  const addNewItemMutation = useMutation({
    mutationFn: async () => {
      // First create a product
      const productResponse = await apiRequest("POST", "/api/products", {
        barcode: `manual-${Date.now()}`, // Generate unique barcode for manual items
        name: newItemName,
        brand: newItemBrand || null,
        description: "Manually added item",
        imageUrl: null,
      });
      const product = await productResponse.json();

      // Then add to shopping list
      return apiRequest("POST", "/api/shopping-list", {
        productId: product.id,
        quantity: newItemQuantity,
        unitPrice: newItemPrice || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Item added to shopping list!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      setShowAddDialog(false);
      setNewItemName("");
      setNewItemBrand("");
      setNewItemQuantity(1);
    },
    onError: () => {
      toast({ title: "Failed to add item", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, updates }: { productId: number; updates: Partial<InsertProduct> }) => {
      return apiRequest("PATCH", `/api/products/${productId}`, updates);
    },
    onSuccess: () => {
      toast({ title: "Item updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      setEditingItem(null);
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const handleToggleCompleted = (item: ShoppingListItemWithProduct) => {
    updateItemMutation.mutate({
      id: item.id,
      updates: { completed: !item.completed }
    });
  };

  const getEstimatedPrice = (item: ShoppingListItemWithProduct) => {
    // Use user-defined unit price if available
    if (item.unitPrice) {
      return item.unitPrice;
    }
    
    // Fall back to best available price
    if (item.product.prices.length === 0) return "N/A";
    const bestPrice = item.product.prices.reduce((min, current) => {
      const currentPrice = parseFloat(current.price.replace('$', ''));
      const minPrice = parseFloat(min.price.replace('$', ''));
      return currentPrice < minPrice ? current : min;
    });
    return bestPrice.price;
  };

  const calculateTotalEstimate = () => {
    if (!shoppingList) return 0;
    
    return shoppingList.reduce((total: number, item: ShoppingListItemWithProduct) => {
      let priceValue = 0;
      
      // Use user-defined unit price if available
      if (item.unitPrice) {
        priceValue = parseFloat(item.unitPrice.replace('$', ''));
      } else if (item.product.prices.length > 0) {
        // Fall back to best available price
        const bestPrice = item.product.prices.reduce((min, current) => {
          const currentPrice = parseFloat(current.price.replace('$', ''));
          const minPrice = parseFloat(min.price.replace('$', ''));
          return currentPrice < minPrice ? current : min;
        });
        priceValue = parseFloat(bestPrice.price.replace('$', ''));
      }
      
      const quantity = item.quantity || 1;
      return total + (priceValue * quantity);
    }, 0);
  };

  const totalEstimate = calculateTotalEstimate();
  const completedTotal = shoppingList?.filter(item => item.completed).reduce((total: number, item: ShoppingListItemWithProduct) => {
    let priceValue = 0;
    
    // Use user-defined unit price if available
    if (item.unitPrice) {
      priceValue = parseFloat(item.unitPrice.replace('$', ''));
    } else if (item.product.prices.length > 0) {
      // Fall back to best available price
      const bestPrice = item.product.prices.reduce((min, current) => {
        const currentPrice = parseFloat(current.price.replace('$', ''));
        const minPrice = parseFloat(min.price.replace('$', ''));
        return currentPrice < minPrice ? current : min;
      });
      priceValue = parseFloat(bestPrice.price.replace('$', ''));
    }
    
    const quantity = item.quantity || 1;
    return total + (priceValue * quantity);
  }, 0) || 0;

  const remainingTotal = totalEstimate - completedTotal;

  const startEditing = (item: ShoppingListItemWithProduct) => {
    setEditingItem(item.id);
    setEditName(item.product.name);
    setEditBrand(item.product.brand || "");
    setEditQuantity(item.quantity || 1);
    setEditPrice(item.unitPrice || "");
  };

  const saveEdit = (item: ShoppingListItemWithProduct) => {
    updateProductMutation.mutate({
      productId: item.product.id,
      updates: {
        name: editName,
        brand: editBrand || null,
      },
    });
    
    if (editQuantity !== item.quantity || editPrice !== item.unitPrice) {
      updateItemMutation.mutate({
        id: item.id,
        updates: { 
          quantity: editQuantity,
          unitPrice: editPrice || null
        },
      });
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditName("");
    setEditBrand("");
    setEditQuantity(1);
    setEditPrice("");
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
        <div className="flex items-center space-x-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-ios-blue"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item-name">Item Name *</Label>
                  <Input
                    id="item-name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g., Milk, Bread, Apples"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="item-brand">Brand (Optional)</Label>
                  <Input
                    id="item-brand"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    placeholder="e.g., Organic Valley"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => setShowAddDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addNewItemMutation.mutate()}
                    disabled={!newItemName.trim() || addNewItemMutation.isPending}
                    className="flex-1 bg-ios-blue hover:bg-ios-blue/90"
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
      </div>

      {/* Budget Summary */}
      {shoppingList.length > 0 && (
        <Card className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Budget Estimate</h3>
                <p className="text-sm text-gray-600">Based on best available prices</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  ${totalEstimate.toFixed(2)}
                </div>
                {completedTotal > 0 && (
                  <div className="text-sm text-gray-500">
                    <div>Completed: ${completedTotal.toFixed(2)}</div>
                    <div>Remaining: ${remainingTotal.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-600">
                {shoppingList.filter(item => item.completed).length} completed
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
                <CardContent className="p-4">
                  {editingItem === item.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Item name"
                        className="text-sm"
                      />
                      <Input
                        value={editBrand}
                        onChange={(e) => setEditBrand(e.target.value)}
                        placeholder="Brand (optional)"
                        className="text-sm"
                      />
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="text-sm flex-1"
                        />
                        <Input
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="Unit price (e.g., $2.99)"
                          className="text-sm flex-2"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(item)}
                          disabled={!editName.trim() || updateProductMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          className="text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center mb-3">
                        <Checkbox
                          checked={!!item.completed}
                          onCheckedChange={() => handleToggleCompleted(item)}
                          className="mr-4 h-5 w-5"
                        />
                        <div className="flex-1">
                          <h3 className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                            {item.product.name}
                          </h3>
                          {item.product.brand && (
                            <p className={`text-sm text-gray-600 ${item.completed ? 'line-through' : ''}`}>
                              {item.product.brand}
                            </p>
                          )}
                        </div>
                        <span className="text-xs bg-ios-light-gray px-2 py-1 rounded-full mr-2">
                          {item.quantity}x
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-600">
                          Est. {getEstimatedPrice(item)}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(item)}
                            className="text-ios-blue hover:text-ios-blue/80 h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
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
