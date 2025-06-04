import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Scanner from "@/pages/Scanner";
import ProductDetail from "@/pages/ProductDetail";
import Favorites from "@/pages/Favorites";
import ShoppingList from "@/pages/ShoppingList";
import History from "@/pages/History";
import QRGenerator from "@/pages/QRGenerator";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import BottomNavigation from "@/components/BottomNavigation";
import StatusBar from "@/components/StatusBar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/landing" component={Landing} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/product/:barcode" component={ProductDetail} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/shopping-list" component={ShoppingList} />
      <Route path="/history" component={History} />
      <Route path="/qr-generator" component={QRGenerator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Landing />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative">
      <StatusBar />
      <div className="pb-20">
        <Router />
      </div>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
