import QRCode from 'qrcode';

export const generateQRCode = async (
  content: string,
  canvas: HTMLCanvasElement,
  size: number = 200
) => {
  try {
    await QRCode.toCanvas(canvas, content, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    // Fallback to error display
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#6c757d";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR Generation", size / 2, size / 2 - 10);
      ctx.fillText("Failed", size / 2, size / 2 + 10);
    }
  }
};

export const downloadQRCode = (canvas: HTMLCanvasElement, filename: string = "qrcode.png") => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL();
  link.click();
};
