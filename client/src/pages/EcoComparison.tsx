import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Leaf, Search, Plus, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ProductWithPrices } from "@shared/schema";

export default function EcoComparison() {
  const [, setLocation] = useLocation();
  const [selectedProducts, setSelectedProducts] = useState<ProductWithPrices[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for demonstration - in real app this would fetch from API
  const { data: availableProducts = [] } = useQuery<ProductWithPrices[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      // Return sample eco-friendly products for comparison
      return [
        {
          id: 1,
          barcode: "123456789012",
          name: "iPhone 15 Pro Max",
          brand: "Apple",
          description: "Latest flagship smartphone",
          imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          ecoScore: 72,
          carbonFootprint: "70kg CO2e",
          recyclingInfo: "Device can be recycled through Apple's trade-in program",
          sustainabilityCertifications: ["Energy Star", "EPEAT Gold"],
          packagingType: "Recyclable",
          isEcoFriendly: true,
          prices: []
        },
        {
          id: 2,
          barcode: "789012345678",
          name: "Coca-Cola Classic",
          brand: "Coca-Cola",
          description: "Classic cola soft drink",
          imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
          ecoScore: 45,
          carbonFootprint: "0.33kg CO2e",
          recyclingInfo: "Aluminum can is 100% recyclable",
          sustainabilityCertifications: ["Rainforest Alliance"],
          packagingType: "Recyclable",
          isEcoFriendly: false,
          prices: []
        },
        {
          id: 3,
          barcode: "456789012345",
          name: "Organic Cotton T-Shirt",
          brand: "EcoWear",
          description: "100% organic cotton, fair trade certified",
          imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          ecoScore: 88,
          carbonFootprint: "5.2kg CO2e",
          recyclingInfo: "Cotton is biodegradable and compostable",
          sustainabilityCertifications: ["GOTS Organic", "Fair Trade", "OEKO-TEX"],
          packagingType: "Biodegradable",
          isEcoFriendly: true,
          prices: []
        }
      ];
    },
  });

  const addProduct = (product: ProductWithPrices) => {
    if (selectedProducts.length < 3 && !selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const getEcoScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getEcoScoreLabel = (score: number | null) => {
    if (!score) return "No Data";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-lg font-semibold flex-1">Eco-Friendly Comparison</h1>
        <Leaf className="h-5 w-5 text-green-600" />
      </div>

      <div className="px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search products to compare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Selected Products for Comparison */}
        {selectedProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Comparing {selectedProducts.length} Products</h2>
            
            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {selectedProducts.map((product) => (
                <Card key={product.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                    className="absolute right-2 top-2 h-6 w-6 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm pr-8">{product.name}</CardTitle>
                    {product.brand && (
                      <p className="text-xs text-gray-600">{product.brand}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Eco Score */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">Eco Score</span>
                        <span className={`text-xs font-bold ${getEcoScoreColor(product.ecoScore)}`}>
                          {product.ecoScore ? `${product.ecoScore}/100` : "N/A"}
                        </span>
                      </div>
                      <Progress value={product.ecoScore || 0} className="h-2" />
                      <p className={`text-xs mt-1 ${getEcoScoreColor(product.ecoScore)}`}>
                        {getEcoScoreLabel(product.ecoScore)}
                      </p>
                    </div>

                    {/* Carbon Footprint */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Carbon Footprint</span>
                      <span className="text-xs text-gray-600">{product.carbonFootprint || "No data"}</span>
                    </div>

                    {/* Certifications */}
                    {product.sustainabilityCertifications && product.sustainabilityCertifications.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Certifications</p>
                        <div className="flex flex-wrap gap-1">
                          {product.sustainabilityCertifications.slice(0, 2).map((cert, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                          {product.sustainabilityCertifications.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.sustainabilityCertifications.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Eco-Friendly Badge */}
                    {product.isEcoFriendly && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <Leaf className="h-3 w-3 mr-1" />
                        Eco-Friendly
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Best Choice Recommendation */}
            {selectedProducts.length > 1 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    🌱 Recommended Choice
                  </h3>
                  {(() => {
                    const bestProduct = selectedProducts.reduce((best, current) => 
                      (current.ecoScore || 0) > (best.ecoScore || 0) ? current : best
                    );
                    return (
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{bestProduct.name}</span> has the highest eco score 
                        ({bestProduct.ecoScore}/100) and is the most environmentally friendly choice.
                      </p>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Available Products */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {searchQuery ? `Search Results (${filteredProducts.length})` : "Available Products"}
          </h2>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => {
                const isSelected = !!selectedProducts.find(p => p.id === product.id);
                const canAdd = selectedProducts.length < 3;
                
                return (
                  <Card key={product.id} className={isSelected ? "bg-gray-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          {product.brand && (
                            <p className="text-sm text-gray-600">{product.brand}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">Eco Score:</span>
                              <span className={`text-xs font-semibold ${getEcoScoreColor(product.ecoScore)}`}>
                                {product.ecoScore ? `${product.ecoScore}/100` : "N/A"}
                              </span>
                            </div>
                            {product.isEcoFriendly && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                <Leaf className="h-3 w-3 mr-1" />
                                Eco-Friendly
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant={isSelected ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => addProduct(product)}
                          disabled={isSelected || !canAdd}
                          className="ml-4"
                        >
                          {isSelected ? (
                            "Added"
                          ) : !canAdd ? (
                            "Max 3"
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Compare
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}