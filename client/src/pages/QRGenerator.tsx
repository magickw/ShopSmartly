import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Type, Link, Mail, Phone, QrCode, Share } from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";

type QRType = "text" | "url" | "email" | "phone";

export default function QRGenerator() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<QRType>("text");
  const [content, setContent] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const qrTypes = [
    { type: "text" as QRType, icon: Type, label: "Text" },
    { type: "url" as QRType, icon: Link, label: "Website" },
    { type: "email" as QRType, icon: Mail, label: "Email" },
    { type: "phone" as QRType, icon: Phone, label: "Phone" },
  ];

  const getPlaceholder = () => {
    switch (selectedType) {
      case "text":
        return "Enter your text message...";
      case "url":
        return "https://example.com";
      case "email":
        return "email@example.com";
      case "phone":
        return "+1234567890";
      default:
        return "Enter content...";
    }
  };

  const formatContent = (input: string) => {
    switch (selectedType) {
      case "email":
        return `mailto:${input}`;
      case "phone":
        return `tel:${input}`;
      case "url":
        return input.startsWith("http") ? input : `https://${input}`;
      default:
        return input;
    }
  };

  const handleGenerate = () => {
    if (!content.trim()) return;
    const formattedContent = formatContent(content.trim());
    setGeneratedCode(formattedContent);
  };

  const handleShare = async () => {
    if (!generatedCode) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QR Code",
          text: generatedCode,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(generatedCode);
      // Toast notification would be shown here
    }
  };

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
        <h1 className="text-lg font-semibold">Generate QR Code</h1>
      </div>

      <div className="px-4 mt-6">
        {/* QR Type Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {qrTypes.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "secondary"}
              onClick={() => setSelectedType(type)}
              className={`p-4 h-auto flex flex-col space-y-2 ${
                selectedType === type 
                  ? "bg-ios-blue hover:bg-ios-blue/90 text-white" 
                  : "bg-ios-light-gray hover:bg-gray-200 text-black"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
            </Button>
          ))}
        </div>

        {/* Input Form */}
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="content" className="block text-sm font-medium mb-2">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getPlaceholder()}
              rows={3}
              className="resize-none border-gray-200 rounded-xl"
            />
          </div>
        </div>

        {/* Generated QR Code */}
        <Card className="bg-white border border-gray-100 mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center">
              {generatedCode ? (
                <QRCodeDisplay content={generatedCode} size={192} />
              ) : (
                <div className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-sm text-ios-gray">
              {generatedCode ? "QR Code Generated" : "QR Code Preview"}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={!content.trim()}
            className="w-full bg-ios-blue hover:bg-ios-blue/90 text-white py-4 rounded-xl font-medium h-auto"
          >
            <QrCode className="mr-2 h-5 w-5" />
            Generate QR Code
          </Button>
          <Button
            onClick={handleShare}
            disabled={!generatedCode}
            variant="secondary"
            className="w-full bg-ios-gray hover:bg-ios-gray/90 text-white py-4 rounded-xl font-medium h-auto"
          >
            <Share className="mr-2 h-5 w-5" />
            Share QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}
