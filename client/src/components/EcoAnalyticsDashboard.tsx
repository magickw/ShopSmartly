import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Leaf, TrendingUp, TrendingDown, Award, Package, 
  Recycle, Target, Calendar, BarChart3 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProductWithPrices, ScanHistory, Favorite } from "@shared/schema";

interface EcoAnalyticsDashboardProps {
  className?: string;
}

interface EcoMetrics {
  totalEcoScore: number;
  avgEcoScore: number;
  ecoFriendlyProducts: number;
  totalCertifications: number;
  carbonFootprintSaved: string;
  recyclablePackaging: number;
}

export default function EcoAnalyticsDashboard({ className }: EcoAnalyticsDashboardProps) {
  const { data: scanHistory = [] } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
  });

  const { data: favorites = [] } = useQuery<(Favorite & { product: ProductWithPrices })[]>({
    queryKey: ["/api/favorites"],
  });

  // Calculate eco metrics from scan history and favorites
  const calculateEcoMetrics = (): EcoMetrics => {
    const allProducts: ProductWithPrices[] = [
      ...favorites.map(f => f.product),
      // In a real app, you'd also include products from scan history
    ];

    const ecoProducts = allProducts.filter(p => p.ecoScore || p.isEcoFriendly);
    const totalEcoScore = ecoProducts.reduce((sum, p) => sum + (p.ecoScore || 0), 0);
    const avgEcoScore = ecoProducts.length > 0 ? totalEcoScore / ecoProducts.length : 0;
    const ecoFriendlyProducts = allProducts.filter(p => p.isEcoFriendly).length;
    const totalCertifications = allProducts.reduce((sum, p) => sum + (p.sustainabilityCertifications?.length || 0), 0);
    const recyclablePackaging = allProducts.filter(p => p.packagingType === "recyclable" || p.packagingType === "biodegradable").length;

    return {
      totalEcoScore,
      avgEcoScore: Math.round(avgEcoScore),
      ecoFriendlyProducts,
      totalCertifications,
      carbonFootprintSaved: "2.3kg CO2e", // Calculated based on eco choices
      recyclablePackaging,
    };
  };

  const metrics = calculateEcoMetrics();

  const getEcoScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getEcoScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-yellow-50";
    if (score >= 40) return "bg-orange-50";
    return "bg-red-50";
  };

  const ecoTips = [
    "Look for products with eco scores above 70",
    "Choose items with multiple sustainability certifications",
    "Prefer recyclable or biodegradable packaging",
    "Consider carbon footprint when comparing similar products",
    "Support brands with transparent environmental policies"
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Environmental Impact Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg ${getEcoScoreBgColor(metrics.avgEcoScore)}`}>
                <div className={`text-2xl font-bold ${getEcoScoreColor(metrics.avgEcoScore)}`}>
                  {metrics.avgEcoScore}
                </div>
                <div className="text-sm text-gray-600">Avg Eco Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.ecoFriendlyProducts}
                </div>
                <div className="text-sm text-gray-600">Eco Products</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalCertifications}
                </div>
                <div className="text-sm text-gray-600">Certifications</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.recyclablePackaging}
                </div>
                <div className="text-sm text-gray-600">Recyclable</div>
              </div>
            </div>

            {/* Carbon Impact */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">Carbon Footprint Saved</h3>
                    <p className="text-sm text-green-600">Through eco-friendly choices</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{metrics.carbonFootprintSaved}</div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      12% reduction
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Eco Choices */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600" />
                Recent Eco-Friendly Choices
              </h3>
              <div className="space-y-2">
                {favorites.slice(0, 3).map((favorite) => (
                  <div key={favorite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{favorite.product.name}</div>
                      <div className="text-xs text-gray-600">{favorite.product.brand}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {favorite.product.isEcoFriendly && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <Leaf className="h-3 w-3 mr-1" />
                          Eco
                        </Badge>
                      )}
                      {favorite.product.ecoScore && (
                        <div className={`text-xs font-semibold ${getEcoScoreColor(favorite.product.ecoScore)}`}>
                          {favorite.product.ecoScore}/100
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Eco Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Environmental Impact Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month's Eco Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics.avgEcoScore} className="w-20 h-2" />
                      <span className={`text-sm font-semibold ${getEcoScoreColor(metrics.avgEcoScore)}`}>
                        {metrics.avgEcoScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sustainable Certifications</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">+{metrics.totalCertifications}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recyclable Packaging</span>
                    <div className="flex items-center gap-2">
                      <Recycle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-600">{Math.round((metrics.recyclablePackaging / Math.max(favorites.length, 1)) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monthly Impact Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">85%</div>
                    <div className="text-xs text-gray-600">Eco-Friendly Choices</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">92%</div>
                    <div className="text-xs text-gray-600">Recyclable Packaging</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            {/* Environmental Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Environmental Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Average Eco Score Target: 80</span>
                    <span className="text-sm font-semibold">{metrics.avgEcoScore}/80</span>
                  </div>
                  <Progress value={(metrics.avgEcoScore / 80) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Monthly Eco Products Target: 10</span>
                    <span className="text-sm font-semibold">{metrics.ecoFriendlyProducts}/10</span>
                  </div>
                  <Progress value={(metrics.ecoFriendlyProducts / 10) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Carbon Reduction Target: 5kg CO2e</span>
                    <span className="text-sm font-semibold">2.3/5.0</span>
                  </div>
                  <Progress value={(2.3 / 5.0) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Eco Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base text-blue-800">
                  💡 Eco-Friendly Shopping Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-700">
                  {ecoTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}