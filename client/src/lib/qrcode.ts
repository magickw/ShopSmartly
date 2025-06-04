// QR Code generation utilities
// Using a simple implementation that draws a basic QR code pattern

export const generateQRCode = (
  content: string,
  canvas: HTMLCanvasElement,
  size: number = 200
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);

  // For this demo, we'll create a simple pattern
  // In a real app, you'd use a library like qrcode.js
  const moduleSize = size / 25; // 25x25 grid
  ctx.fillStyle = "black";

  // Create a simple QR-like pattern based on content hash
  const hash = simpleHash(content);
  
  // Draw finder patterns (corners)
  drawFinderPattern(ctx, 0, 0, moduleSize);
  drawFinderPattern(ctx, 18 * moduleSize, 0, moduleSize);
  drawFinderPattern(ctx, 0, 18 * moduleSize, moduleSize);

  // Draw data pattern based on content
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      // Skip finder pattern areas
      if (isFinderPatternArea(i, j)) continue;
      
      if ((hash + i * j) % 3 === 0) {
        ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
      }
    }
  }
};

const drawFinderPattern = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number
) => {
  // Draw 7x7 finder pattern
  ctx.fillStyle = "black";
  ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
  
  ctx.fillStyle = "white";
  ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
  
  ctx.fillStyle = "black";
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
};

const isFinderPatternArea = (i: number, j: number): boolean => {
  // Top-left
  if (i < 9 && j < 9) return true;
  // Top-right
  if (i > 15 && j < 9) return true;
  // Bottom-left
  if (i < 9 && j > 15) return true;
  return false;
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

export const downloadQRCode = (canvas: HTMLCanvasElement, filename: string = "qrcode.png") => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL();
  link.click();
};
