import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Leaf, TrendingUp, TrendingDown, Minus, Award, Recycle, Package } from "lucide-react";
import type { ProductWithPrices } from "@shared/schema";

interface EcoComparisonChartProps {
  products: ProductWithPrices[];
  className?: string;
}

export default function EcoComparisonChart({ products, className }: EcoComparisonChartProps) {
  const ecoProducts = products.filter(p => p.ecoScore || p.carbonFootprint || p.sustainabilityCertifications?.length);

  if (ecoProducts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Leaf className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            Add products with environmental data to see eco-friendly comparisons
          </p>
        </CardContent>
      </Card>
    );
  }

  const getEcoScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getEcoScoreTextColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getCarbonTrend = (carbonFootprint: string) => {
    const value = parseFloat(carbonFootprint.replace(/[^\d.]/g, ''));
    if (value < 5) return { icon: TrendingDown, color: "text-green-600", label: "Low Impact" };
    if (value < 15) return { icon: Minus, color: "text-yellow-600", label: "Medium Impact" };
    return { icon: TrendingUp, color: "text-red-600", label: "High Impact" };
  };

  const bestEcoScore = Math.max(...ecoProducts.filter(p => p.ecoScore).map(p => p.ecoScore || 0));
  const averageEcoScore = ecoProducts.filter(p => p.ecoScore).reduce((sum, p) => sum + (p.ecoScore || 0), 0) / ecoProducts.filter(p => p.ecoScore).length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Environmental Impact Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{bestEcoScore}</div>
            <div className="text-sm text-gray-600">Best Eco Score</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{Math.round(averageEcoScore || 0)}</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
        </div>

        <Separator />

        {/* Product Comparisons */}
        <div className="space-y-4">
          {ecoProducts.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium truncate flex-1">{product.name}</h4>
                {product.isEcoFriendly && (
                  <Badge className="bg-green-100 text-green-800 ml-2">
                    <Leaf className="h-3 w-3 mr-1" />
                    Eco-Friendly
                  </Badge>
                )}
              </div>

              {/* Eco Score */}
              {product.ecoScore && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Eco Score</span>
                    <span className={`font-bold ${getEcoScoreTextColor(product.ecoScore)}`}>
                      {product.ecoScore}/100
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={product.ecoScore} className="h-2" />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-full ${getEcoScoreColor(product.ecoScore)}`}
                      style={{ width: `${product.ecoScore}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Carbon Footprint */}
              {product.carbonFootprint && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Carbon Footprint</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const trend = getCarbonTrend(product.carbonFootprint);
                      const Icon = trend.icon;
                      return (
                        <>
                          <Icon className={`h-4 w-4 ${trend.color}`} />
                          <span className="text-sm">{product.carbonFootprint}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {product.sustainabilityCertifications && product.sustainabilityCertifications.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Certifications</span>
                    <Badge variant="outline" className="text-xs">
                      {product.sustainabilityCertifications.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.sustainabilityCertifications.slice(0, 3).map((cert, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                    {product.sustainabilityCertifications.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{product.sustainabilityCertifications.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Packaging */}
              {product.packagingType && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Packaging</span>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {product.packagingType}
                  </Badge>
                </div>
              )}

              {/* Recycling Info */}
              {product.recyclingInfo && (
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Recycle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Recycling</span>
                  </div>
                  <p className="text-gray-600 text-xs">{product.recyclingInfo}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Environmental Tips */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h5 className="font-medium text-green-800 mb-2">💡 Eco-Friendly Shopping Tips</h5>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Choose products with eco scores above 70</li>
            <li>• Look for multiple sustainability certifications</li>
            <li>• Prefer recyclable or biodegradable packaging</li>
            <li>• Consider carbon footprint when comparing similar products</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}