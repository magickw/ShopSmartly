import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, Heart, ShoppingCart, History } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const tabs = [
    { path: "/", icon: Camera, label: "Scanner" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/shopping-list", icon: ShoppingCart, label: "List" },
    { path: "/history", icon: History, label: "History" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/" || location.startsWith("/product/");
    }
    return location === path;
  };

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100">
      <div className="flex justify-around py-2">
        {tabs.map(({ path, icon: Icon, label }) => (
          <Button
            key={path}
            variant="ghost"
            onClick={() => setLocation(path)}
            className={`flex flex-col items-center py-2 px-4 ${
              isActive(path) 
                ? "text-ios-blue" 
                : "text-ios-gray hover:text-ios-blue"
            }`}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
