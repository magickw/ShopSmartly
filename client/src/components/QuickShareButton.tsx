import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Copy, Check } from "lucide-react";
import { SiX, SiFacebook, SiWhatsapp, SiTelegram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface QuickShareButtonProps {
  productName: string;
  barcode: string;
  bestPrice?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export default function QuickShareButton({ 
  productName, 
  barcode, 
  bestPrice, 
  size = "sm",
  variant = "ghost",
  className = ""
}: QuickShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close share menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }

    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu]);

  const generateShareText = () => {
    const priceText = bestPrice && bestPrice !== "N/A" ? ` - Best price: ${bestPrice}` : "";
    return `Check out this product: ${productName}${priceText}\nBarcode: ${barcode}\n\nFound via Price Scanner App`;
  };

  const generateShareUrl = () => {
    return `${window.location.origin}/product/${barcode}`;
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = generateShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
      setShowShareMenu(false);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const shareText = generateShareText();
    const shareUrl = generateShareUrl();
    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      setShowShareMenu(false);
    }
  };

  return (
    <div className="relative" ref={shareMenuRef}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowShareMenu(!showShareMenu)}
        className={className}
      >
        <Share2 className="h-4 w-4" />
      </Button>

      {showShareMenu && (
        <Card className="absolute top-full right-0 mt-2 w-64 z-50 shadow-lg border">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Share this product</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialShare('whatsapp')}
                  className="flex items-center gap-2 justify-start text-green-600"
                >
                  <SiWhatsapp className="h-4 w-4" />
                  WhatsApp
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialShare('twitter')}
                  className="flex items-center gap-2 justify-start text-blue-400"
                >
                  <SiX className="h-4 w-4" />
                  X
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialShare('facebook')}
                  className="flex items-center gap-2 justify-start text-blue-600"
                >
                  <SiFacebook className="h-4 w-4" />
                  Facebook
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialShare('telegram')}
                  className="flex items-center gap-2 justify-start text-blue-500"
                >
                  <SiTelegram className="h-4 w-4" />
                  Telegram
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 justify-center"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}