import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            startBarcodeDetection();
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera access denied or not available");
        setIsLoading(false);
      }
    };

    const startBarcodeDetection = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      setIsScanning(true);
      
      // Check if BarcodeDetector is available
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
          });
          
          const detectBarcodes = async () => {
            if (!videoRef.current || !canvasRef.current) return;
            
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (!context) return;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            try {
              const barcodes = await barcodeDetector.detect(canvas);
              if (barcodes.length > 0) {
                const barcode = barcodes[0].rawValue;
                console.log('Barcode detected:', barcode);
                onScanSuccess(barcode);
                return;
              }
            } catch (err) {
              console.error('Barcode detection error:', err);
            }
            
            // Continue scanning
            if (isScanning) {
              scanIntervalRef.current = setTimeout(detectBarcodes, 100);
            }
          };
          
          // Start detection after video is ready
          setTimeout(detectBarcodes, 1000);
        } catch (err) {
          console.error('BarcodeDetector initialization error:', err);
          setError("Barcode detection not supported on this device");
        }
      } else {
        console.log('BarcodeDetector not available, using fallback');
        setError("Barcode detection not supported on this browser");
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
      }
      setIsScanning(false);
    };
  }, [onScanSuccess, isScanning]);

  // Fallback function for testing when native detection isn't available
  const simulateScan = () => {
    const sampleBarcodes = ["123456789012", "789012345678", "456789012345"];
    const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
    onScanSuccess(randomBarcode);
  };

  if (error) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white">
        <div className="text-center p-6 max-w-sm">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Camera Not Available</h3>
          <p className="text-gray-300 mb-6 text-sm">
            Camera access is required for barcode scanning. Please check your browser permissions or try the test scan feature.
          </p>
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="w-full text-white border-white hover:bg-white hover:text-black"
          >
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
      
      {/* Hidden canvas for barcode detection */}
      <canvas
        ref={canvasRef}
        className="hidden"
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

      {/* Instructions and status */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center mb-2">
            <Camera className="w-5 h-5 text-white mr-2" />
            <span className="text-white text-sm">
              {isScanning ? "Scanning for barcodes..." : "Position barcode within the frame"}
            </span>
          </div>
          {isScanning && (
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto animate-pulse"></div>
          )}
        </div>

      </div>
    </div>
  );
}
