import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Camera, QrCode, ChevronRight, Keyboard, Coffee, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ScanHistory } from "@shared/schema";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");

  const { data: recentScans = [] } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
  });

  const handleScanSuccess = (barcode: string) => {
    setShowScanner(false);
    setLocation(`/product/${barcode}`);
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      setShowManualEntry(false);
      setManualBarcode("");
      setLocation(`/product/${manualBarcode.trim()}`);
    }
  };

  return (
    <div className="px-4">
      {/* Header */}
      <div className="py-3 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-center">PriceScan</h1>
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
              <p className="text-white text-sm text-center">Position barcode within the frame</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <Button
          onClick={() => setShowScanner(true)}
          className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white py-4 rounded-xl text-lg font-medium h-auto"
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
          <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
          <div className="space-y-3">
            {recentScans.slice(0, 3).map((scan) => (
              <Card key={scan.id} className="bg-ios-light-gray border-0 cursor-pointer hover:bg-gray-100 transition-colors">
                <CardContent className="p-4 flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-gray-500">IMG</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{scan.productName}</h3>
                    <p className="text-sm text-ios-gray">Best: {scan.bestPrice}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ios-gray" />
                </CardContent>
              </Card>
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
            onClick={() => window.open('https://buymeacoffee.com/yourhandle', '_blank')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <Coffee className="h-4 w-4 mr-2" />
            Buy me a coffee
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Help keep this app free and improve features
          </p>
        </div>
      </div>
    </div>
  );
}
