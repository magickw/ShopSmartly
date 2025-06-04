import { useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Heart, ShoppingCart, Leaf, BarChart3, Share2, MessageCircle, Mail, Copy, ExternalLink } from "lucide-react";
import { SiX, SiFacebook, SiWhatsapp, SiTelegram } from "react-icons/si";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EcoFriendlyComparison from "@/components/EcoFriendlyComparison";
import MerchantPriceComparison from "@/components/MerchantPriceComparison";
import QuickShareButton from "@/components/QuickShareButton";
import type { ScanResult } from "@shared/schema";

export default function ProductDetail() {
  const params = useParams<{ barcode: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [needsScan, setNeedsScan] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const getShareData = () => {
    if (!scanResult?.product) return null;
    const { product, bestPrice } = scanResult;
    return {
      title: `${product.name} - Price Comparison`,
      text: `Check out this product: ${product.name} ${product.brand ? `by ${product.brand}` : ''}\nBest price: ${bestPrice}\nBarcode: ${product.barcode}`,
      url: window.location.href
    };
  };

  const handleNativeShare = async () => {
    const shareData = getShareData();
    if (!shareData) return;

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setShowShareMenu(false);
      } else {
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Link copied!",
          description: "Product details copied to clipboard",
        });
        setShowShareMenu(false);
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

  const handleSocialShare = (platform: string) => {
    const shareData = getShareData();
    if (!shareData) return;

    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedTitle = encodeURIComponent(shareData.title);

    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text}\n${shareData.url}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodeURIComponent(`${shareData.text}\n${shareData.url}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${shareData.text}\n\n${shareData.url}`)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      setShowShareMenu(false);
    }
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const { data: scanResult, isLoading, error } = useQuery<ScanResult>({
    queryKey: [`/api/products`, params.barcode],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products/${params.barcode}`);
      return response.json();
    },
    enabled: !!params.barcode,
    retry: false,
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/scan", { barcode: params.barcode });
      return response.json();
    },
    onSuccess: (data) => {
      setNeedsScan(false);
      queryClient.invalidateQueries({ queryKey: [`/api/products`, params.barcode] });
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan product",
        variant: "destructive",
      });
    }
  });

  // If product not found, trigger scan automatically
  useEffect(() => {
    if (error && error.message.includes("Product not found") && !needsScan && !scanMutation.isPending) {
      setNeedsScan(true);
      scanMutation.mutate();
    }
  }, [error, needsScan, scanMutation]);

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

  const affiliateClickMutation = useMutation({
    mutationFn: async ({ productId, retailerId, originalUrl }: { productId: number, retailerId: number, originalUrl: string }) => {
      const response = await apiRequest("POST", "/api/affiliate/click", {
        productId,
        retailerId,
        originalUrl
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Open affiliate URL in new tab
      window.open(data.affiliateUrl, '_blank');
    },
    onError: () => {
      toast({ 
        title: "Affiliate link error", 
        description: "Failed to generate affiliate link",
        variant: "destructive" 
      });
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
        {scanResult?.product && (
          <QuickShareButton
            productName={scanResult.product.name}
            barcode={scanResult.product.barcode}
            bestPrice={scanResult.bestPrice}
            className="text-blue-600 mr-2"
          />
        )}
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
          <div className="bg-gray-100 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-500 mb-1">Barcode</p>
            <p className="font-mono text-sm font-medium">{product.barcode}</p>
          </div>
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

        {/* Shopping Links with Affiliate Marketing */}
        {scanResult?.product?.prices && scanResult.product.prices.length > 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                Shop Now
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compare prices and buy from trusted retailers
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {scanResult.product.prices.map((priceData) => (
                <Button
                  key={priceData.id}
                  onClick={() => affiliateClickMutation.mutate({
                    productId: scanResult.product.id,
                    retailerId: priceData.retailer.id,
                    originalUrl: `https://${priceData.retailer.name.toLowerCase()}.com/search?q=${encodeURIComponent(scanResult.product.name)}`
                  })}
                  disabled={affiliateClickMutation.isPending}
                  variant="outline"
                  className="w-full justify-between hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{priceData.retailer.logo}</span>
                    <span className="font-medium">{priceData.retailer.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{priceData.price}</div>
                    <div className="text-xs text-gray-500">{priceData.stock || 'Available'}</div>
                  </div>
                </Button>
              ))}
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
