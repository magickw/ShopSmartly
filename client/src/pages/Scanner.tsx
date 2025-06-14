import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BarcodeScanner from "@/components/BarcodeScanner";
import QuickShareButton from "@/components/QuickShareButton";
import {
  Camera,
  QrCode,
  ChevronRight,
  Keyboard,
  Coffee,
  Heart,
  Lock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { ScanHistory } from "@shared/schema";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: recentScans = [] } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
  });

  const handleScanSuccess = (barcode: string) => {
    setShowScanner(false);
    setLocation(`/product/${barcode}`);
  };

  const handleManualSubmit = async () => {
    if (!manualBarcode.trim()) return;

    const barcode = manualBarcode.trim();
    setShowManualEntry(false);
    setManualBarcode("");

    // Add to scan history when manually searching
    try {
      await apiRequest("GET", `/api/products/${barcode}?addToHistory=true`);
    } catch (error) {
      // Continue to product page even if history add fails
      console.log("Failed to add to history:", error);
    }

    setLocation(`/product/${barcode}`);
  };

  const handleStartScanning = () => {
    setShowScanner(true);
  };

  return (
    <div className="px-4">
      {/* Header */}
      <div className="py-3 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-center">ShopSmartly</h1>
      </div>

      {/* Camera/Scanner Area */}
      <div className="relative bg-black h-80 mt-6 rounded-xl overflow-hidden">
        {showScanner ? (
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-white w-64 h-32 rounded-lg relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-ios-blue"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-ios-blue"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-ios-blue"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-ios-blue"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-ios-blue opacity-70 animate-pulse"></div>
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <p className="text-white text-sm text-center">
                Position barcode within the frame
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <Button
          onClick={handleStartScanning}
          className="w-full py-4 rounded-xl text-lg font-medium h-auto bg-ios-blue hover:bg-ios-blue/90 text-white"
        >
          <Camera className="mr-2 h-5 w-5" />
          Start Scanning
        </Button>
        <Button
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="w-full bg-ios-green hover:bg-ios-green/90 text-white py-4 rounded-xl text-lg font-medium h-auto"
        >
          <Keyboard className="mr-2 h-5 w-5" />
          Enter Barcode Manually
        </Button>
        <Button
          onClick={() => setLocation("/qr-generator")}
          className="w-full bg-ios-orange hover:bg-ios-orange/90 text-white py-4 rounded-xl text-lg font-medium h-auto"
        >
          <QrCode className="mr-2 h-5 w-5" />
          Generate QR Code
        </Button>
      </div>

      {/* Manual Entry Form */}
      {showManualEntry && (
        <Card className="mt-6 bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-barcode" className="text-sm font-medium">
                  Barcode Number
                </Label>
                <Input
                  id="manual-barcode"
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode (e.g., 123456789012)"
                  className="mt-1 rounded-xl border-gray-200"
                />
              </div>
              <Button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white py-3 rounded-xl font-medium"
              >
                Search Product
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Scans</h2>
            {recentScans.length > 3 && (
              <Link href="/history">
                <span className="text-sm text-blue-600 hover:underline">
                  View all ({recentScans.length})
                </span>
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {recentScans
              .slice(-3)
              .reverse()
              .map((scan) => (
                <div key={scan.id} className="relative group">
                  <Link href={`/product/${scan.barcode}`}>
                    <Card className="bg-white border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardContent className="p-4 flex items-center">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-500">
                            IMG
                          </span>
                        </div>
                        <div className="flex-1 pr-8">
                          <h3 className="font-medium">{scan.productName}</h3>
                          <p className="text-sm text-gray-500">
                            Scanned:{" "}
                            {scan.scannedAt
                              ? new Date(scan.scannedAt).toLocaleDateString()
                              : "Recently"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </CardContent>
                    </Card>
                  </Link>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <QuickShareButton
                      productName={scan.productName}
                      barcode={scan.barcode}
                      bestPrice={scan.bestPrice || undefined}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-white/80 hover:bg-white border border-gray-200"
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Buy Me a Coffee Donation */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm text-gray-600">Support this app</span>
          </div>
          <Button
            onClick={() =>
              window.open("https://buymeacoffee.com/bfguo", "_blank")
            }
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <Coffee className="h-4 w-4 mr-2" />
            Buy me a coffee
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Help keep this app free and improve features
          </p>
          {/* Developer Attribution */}
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
