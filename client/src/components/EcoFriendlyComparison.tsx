import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Recycle, Award, Package } from "lucide-react";
import type { ProductWithPrices } from "@shared/schema";

interface EcoFriendlyComparisonProps {
  product: ProductWithPrices;
  className?: string;
}

export default function EcoFriendlyComparison({ product, className }: EcoFriendlyComparisonProps) {
  const getEcoScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getEcoScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const getCertificationColor = (cert: string) => {
    const colors: Record<string, string> = {
      "Organic": "bg-green-100 text-green-800",
      "Fair Trade": "bg-blue-100 text-blue-800",
      "FSC Certified": "bg-emerald-100 text-emerald-800",
      "Energy Star": "bg-yellow-100 text-yellow-800",
      "Cradle to Cradle": "bg-purple-100 text-purple-800",
      "USDA Organic": "bg-green-100 text-green-800",
      "Rainforest Alliance": "bg-teal-100 text-teal-800",
    };
    return colors[cert] || "bg-gray-100 text-gray-800";
  };

  const getPackagingIcon = (packagingType: string) => {
    switch (packagingType?.toLowerCase()) {
      case "recyclable":
        return <Recycle className="h-4 w-4 text-green-600" />;
      case "biodegradable":
        return <Leaf className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!product.ecoScore && !product.carbonFootprint && !product.sustainabilityCertifications?.length) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Leaf className="h-5 w-5 text-green-600" />
          Environmental Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Eco Score */}
        {product.ecoScore && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Eco Score</span>
              <span className={`font-bold ${getEcoScoreColor(product.ecoScore)}`}>
                {product.ecoScore}/100 - {getEcoScoreLabel(product.ecoScore)}
              </span>
            </div>
            <Progress value={product.ecoScore} className="h-2" />
          </div>
        )}

        {/* Carbon Footprint */}
        {product.carbonFootprint && (
          <div className="flex justify-between items-center">
            <span className="font-medium">Carbon Footprint</span>
            <span className="text-sm text-gray-600">{product.carbonFootprint}</span>
          </div>
        )}

        {/* Sustainability Certifications */}
        {product.sustainabilityCertifications && product.sustainabilityCertifications.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Certifications</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sustainabilityCertifications.map((cert, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={getCertificationColor(cert)}
                >
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Packaging Information */}
        {product.packagingType && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getPackagingIcon(product.packagingType)}
              <span className="font-medium">Packaging</span>
            </div>
            <span className="text-sm text-gray-600 capitalize">{product.packagingType}</span>
          </div>
        )}

        {/* Recycling Information */}
        {product.recyclingInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Recycle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Recycling Info</span>
            </div>
            <p className="text-sm text-gray-600">{product.recyclingInfo}</p>
          </div>
        )}

        {/* Eco-Friendly Badge */}
        {product.isEcoFriendly && (
          <div className="flex justify-center pt-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <Leaf className="h-3 w-3 mr-1" />
              Eco-Friendly Product
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}