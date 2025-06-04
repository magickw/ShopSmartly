import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Leaf, Search, Plus, X, BarChart3, TrendingUp, Award, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import EcoComparisonChart from "@/components/EcoComparisonChart";
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
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                <TabsTrigger value="charts">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                {/* Quick Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <Leaf className="h-4 w-4" />
                        Recommended Choice
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
              </TabsContent>

              <TabsContent value="detailed" className="space-y-4">
                {/* Detailed Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Detailed Environmental Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Product</th>
                            <th className="text-center p-2">Eco Score</th>
                            <th className="text-center p-2">Carbon Footprint</th>
                            <th className="text-center p-2">Certifications</th>
                            <th className="text-center p-2">Packaging</th>
                            <th className="text-center p-2">Recyclable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProducts.map((product) => (
                            <tr key={product.id} className="border-b">
                              <td className="p-2">
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-gray-600">{product.brand}</div>
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className={`font-bold ${getEcoScoreColor(product.ecoScore)}`}>
                                  {product.ecoScore || "N/A"}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                {product.carbonFootprint || "No data"}
                              </td>
                              <td className="p-2 text-center">
                                <div className="text-xs">
                                  {product.sustainabilityCertifications?.length || 0} certs
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <Badge variant="outline" className="text-xs">
                                  {product.packagingType || "Unknown"}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                {product.recyclingInfo ? (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                    Yes
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Unknown
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Environmental Impact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProducts.map((product) => (
                    <Card key={product.id}>
                      <CardHeader>
                        <CardTitle className="text-sm">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {product.sustainabilityCertifications && product.sustainabilityCertifications.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium">Certifications</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {product.sustainabilityCertifications.map((cert, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {product.recyclingInfo && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <div className="font-medium mb-1">Recycling Information</div>
                            <p className="text-gray-600 text-xs">{product.recyclingInfo}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <EcoComparisonChart products={selectedProducts} />
                
                {/* Environmental Impact Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Environmental Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedProducts.filter(p => p.isEcoFriendly).length}
                        </div>
                        <div className="text-sm text-gray-600">Eco-Friendly Products</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedProducts.reduce((sum, p) => sum + (p.sustainabilityCertifications?.length || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total Certifications</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {Math.round(selectedProducts.reduce((sum, p) => sum + (p.ecoScore || 0), 0) / selectedProducts.length) || 0}
                        </div>
                        <div className="text-sm text-gray-600">Average Eco Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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