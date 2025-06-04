import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, Heart, ShoppingCart, History, QrCode } from "lucide-react";
import GoogleAuth from "@/components/GoogleAuth";
import AppleAuth from "@/components/AppleAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const { toast } = useToast();

  const handleAuthSuccess = (token: string, user: any) => {
    toast({
      title: "Welcome!",
      description: `Successfully signed in as ${user.firstName || user.email}`,
    });
    
    // Invalidate auth queries to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    // Refresh the page to trigger the authentication state change
    window.location.reload();
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
          <div className="space-y-4 max-w-md mx-auto">
            <GoogleAuth onSuccess={handleAuthSuccess} />
            <AppleAuth onSuccess={handleAuthSuccess} />
          </div>
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
              <div className="space-y-4 max-w-md mx-auto">
                <GoogleAuth onSuccess={handleAuthSuccess} />
                <AppleAuth onSuccess={handleAuthSuccess} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}