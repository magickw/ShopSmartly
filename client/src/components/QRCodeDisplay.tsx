import { useEffect, useRef } from "react";
import { generateQRCode } from "@/lib/qrcode";

interface QRCodeDisplayProps {
  content: string;
  size?: number;
}

export default function QRCodeDisplay({ content, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && content) {
      generateQRCode(content, canvasRef.current, size);
    }
  }, [content, size]);

  return (
    <canvas
      ref={canvasRef}
      className="border rounded-lg"
      width={size}
      height={size}
    />
  );
}
