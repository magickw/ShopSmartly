import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, Heart, ShoppingCart, History, QrCode } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Smart Shopping Assistant
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Scan barcodes, compare prices across retailers, and manage your shopping with ease. 
            Get the best deals from Target, Walmart, and Amazon in one place.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Sign In to Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Scan className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Barcode Scanner</CardTitle>
              <CardDescription>
                Instantly scan product barcodes to get real-time pricing information
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Save Favorites</CardTitle>
              <CardDescription>
                Keep track of products you love and monitor their prices over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <ShoppingCart className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Shopping Lists</CardTitle>
              <CardDescription>
                Create and manage shopping lists with estimated pricing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <History className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Scan History</CardTitle>
              <CardDescription>
                Review your previous scans and price comparisons
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <QrCode className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>QR Generator</CardTitle>
              <CardDescription>
                Generate QR codes for text, URLs, emails, and phone numbers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">
                $
              </div>
              <CardTitle>Price Comparison</CardTitle>
              <CardDescription>
                Compare prices across Target, Walmart, and Amazon instantly
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Start Saving?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of smart shoppers who use our app to find the best deals. 
                Sign in with your Google or Apple account to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-3"
              >
                Sign In Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}