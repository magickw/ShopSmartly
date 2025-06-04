import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Scan, Heart, ShoppingCart, History, QrCode, LogOut, Leaf } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return first + last || "U";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with user info */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ready to find the best deals?
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/scanner">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Scan className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Scan Products</CardTitle>
                <CardDescription>
                  Scan barcodes to compare prices across retailers
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/favorites">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <CardTitle>My Favorites</CardTitle>
                <CardDescription>
                  View your saved products and track price changes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/shopping-list">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <ShoppingCart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Shopping List</CardTitle>
                <CardDescription>
                  Manage your shopping lists with price estimates
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <History className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Scan History</CardTitle>
                <CardDescription>
                  Review your previous scans and comparisons
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/qr-generator">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <QrCode className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>QR Generator</CardTitle>
                <CardDescription>
                  Create QR codes for sharing information
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/eco-comparison">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Leaf className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Eco Comparison</CardTitle>
                <CardDescription>
                  Compare environmental impact of products
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/scanner">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">
                  $
                </div>
                <CardTitle className="text-blue-700 dark:text-blue-300">Start Scanning</CardTitle>
                <CardDescription>
                  Find the best deals right now
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Check your scan history to see recent price comparisons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Add products to favorites to track price changes over time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Smart Shopping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Create shopping lists to estimate total costs before you shop
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}