import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Scan, Heart, ShoppingCart, History, QrCode, LogOut, Leaf, BarChart3, Clock } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import BannerAd from "@/components/BannerAd";
import ScanLimitBanner from "@/components/ScanLimitBanner";
import QuickShareButton from "@/components/QuickShareButton";
import { useToast } from "@/hooks/use-toast";

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  advertiser: string;
  adType: string;
  placement: string;
}

interface ScanHistory {
  id: number;
  barcode: string;
  productName: string;
  scannedAt: string;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: homeAds = [], isLoading: adsLoading, error: adsError } = useQuery<Advertisement[]>({
    queryKey: ["/api/ads/home"],
    queryFn: async () => {
      const response = await fetch("/api/ads/home");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return first + last || "U";
  };

  // Fetch recent scans (limit to 3)
  const { data: recentScans = [] } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
  });

  const handleAdDismiss = (adId: number) => {
    toast({
      title: "Ad dismissed",
      description: "This ad has been hidden from your view.",
    });
  };

  const handleShareScan = async (scan: ScanHistory, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const shareData = {
      title: `${scan.productName} - Price Comparison`,
      text: `Check out this product: ${scan.productName}\nBarcode: ${scan.barcode}`,
      url: `${window.location.origin}/product/${scan.barcode}`
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Link copied!",
          description: "Product link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share failed",
        description: "Could not share this product",
        variant: "destructive",
      });
    }
  };

  // Debug logging
  console.log("Home ads data:", homeAds);
  console.log("Ads loading:", adsLoading);
  console.log("Ads error:", adsError);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Scan Limit Banner for Free Users */}
        <ScanLimitBanner />

        {/* Header with user info */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ready to find the best deals?
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Banner Ads */}
        {homeAds.length > 0 && (
          <div className="mb-8 space-y-4">
            {homeAds.map((ad) => (
              <BannerAd
                key={ad.id}
                ad={ad}
                placement="home"
                onDismiss={() => handleAdDismiss(ad.id)}
              />
            ))}
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/scanner">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Scan className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Scan Products</CardTitle>
                <CardDescription>
                  Scan barcodes to compare prices across retailers
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/favorites">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <CardTitle>My Favorites</CardTitle>
                <CardDescription>
                  View your saved products and track price changes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/shopping-list">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <ShoppingCart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Shopping List</CardTitle>
                <CardDescription>
                  Manage your shopping lists with price estimates
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <History className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Scan History</CardTitle>
                <CardDescription>
                  Review your previous scans and comparisons
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/qr-generator">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <QrCode className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>QR Generator</CardTitle>
                <CardDescription>
                  Create QR codes for sharing information
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/eco-comparison">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Leaf className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Eco Comparison</CardTitle>
                <CardDescription>
                  Compare environmental impact of products
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  View shopping insights and trends
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/scanner">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">
                  $
                </div>
                <CardTitle className="text-blue-700 dark:text-blue-300">Start Scanning</CardTitle>
                <CardDescription>
                  Find the best deals right now
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentScans.length > 0 ? (
                <div className="space-y-2">
                  {recentScans.slice(-1).reverse().map((scan) => (
                    <div key={scan.id} className="relative group">
                      <Link href={`/product/${scan.barcode}`}>
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                          <p className="font-medium text-sm truncate pr-8">{scan.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{scan.barcode}</p>
                        </div>
                      </Link>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <QuickShareButton
                          productName={scan.productName}
                          barcode={scan.barcode}
                          bestPrice={scan.bestPrice || undefined}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        />
                      </div>
                    </div>
                  ))}
                  {recentScans.length > 1 && (
                    <Link href="/history">
                      <p className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        View all ({recentScans.length})
                      </p>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No recent scans. Start by scanning a product!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Add products to favorites to track price changes over time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Smart Shopping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Create shopping lists to estimate total costs before you shop
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Developer Attribution */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Developed by{" "}
            <a 
              href="https://github.com/magickw" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Baofeng Guo
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}