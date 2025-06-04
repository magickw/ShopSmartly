import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

interface BannerAdProps {
  ad: Advertisement;
  placement: string;
  className?: string;
  onDismiss?: () => void;
}

export default function BannerAd({ ad, placement, className, onDismiss }: BannerAdProps) {
  const [isVisible, setIsVisible] = useState(true);

  const trackClickMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ads/click", { 
        advertisementId: ad.id,
        userAgent: navigator.userAgent 
      });
    },
  });

  const handleAdClick = () => {
    trackClickMutation.mutate();
    if (ad.targetUrl) {
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  if (ad.adType === 'banner') {
    return (
      <Card className={`relative overflow-hidden border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute right-2 top-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3 w-3" />
        </Button>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {ad.imageUrl && (
              <img 
                src={ad.imageUrl} 
                alt={ad.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{ad.title}</h3>
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                  Ad
                </Badge>
              </div>
              
              {ad.description && (
                <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">by {ad.advertiser}</span>
                
                {ad.targetUrl && (
                  <Button
                    size="sm"
                    onClick={handleAdClick}
                    className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Learn More
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ad.adType === 'native') {
    return (
      <div className={`relative p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400 ${className}`}>
        <Badge className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-700">
          Sponsored
        </Badge>
        
        <div className="flex gap-3 cursor-pointer" onClick={handleAdClick}>
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt={ad.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">{ad.title}</h3>
            {ad.description && (
              <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{ad.advertiser}</span>
              <ExternalLink className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}