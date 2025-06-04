import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, // Use rear camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera access denied or not available");
        setIsLoading(false);
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulate barcode detection (in a real app, you'd use QuaggaJS or similar)
  const simulateScan = () => {
    // Simulate finding a barcode after a delay
    setTimeout(() => {
      onScanSuccess("123456789012"); // Sample barcode
    }, 1000);
  };

  if (error) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white">
        <div className="text-center p-4">
          <p className="mb-4">{error}</p>
          <Button onClick={onClose} variant="outline" className="text-black">
            Close Scanner
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      {/* Close button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Starting camera...</p>
          </div>
        </div>
      )}

      {/* Scanning overlay */}
      {!isLoading && (
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
        </div>
      )}

      {/* Instructions and test button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-white text-sm mb-4">Position barcode within the frame</p>
        <Button 
          onClick={simulateScan}
          className="bg-ios-blue hover:bg-ios-blue/90 text-white"
        >
          Simulate Scan (Demo)
        </Button>
      </div>
    </div>
  );
}
