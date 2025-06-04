import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "@shared/schema";

const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "0.00",
    currency: "USD",
    interval: "month",
    features: [
      "10 scans per day",
      "Basic price comparison",
      "Scan history (7 days)",
      "Community support"
    ],
    dailyScanLimit: 10,
    priceAlerts: false,
    bulkScanning: false,
    analytics: false,
    apiAccess: false
  },
  {
    id: "premium",
    name: "Premium",
    price: "4.99",
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited scans",
      "Price alerts & notifications",
      "Advanced analytics",
      "Extended scan history (90 days)",
      "Priority support",
      "Export data"
    ],
    priceAlerts: true,
    bulkScanning: true,
    analytics: true,
    apiAccess: false
  },
  {
    id: "business",
    name: "Business",
    price: "19.99",
    currency: "USD",
    interval: "month",
    features: [
      "Everything in Premium",
      "API access (1000 calls/month)",
      "Bulk scanning tools",
      "Team collaboration",
      "Custom integrations",
      "Dedicated support"
    ],
    priceAlerts: true,
    bulkScanning: true,
    analytics: true,
    apiAccess: true
  }
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onPlanSelect?: (planId: string) => void;
}

export default function SubscriptionPlans({ currentPlan = "free", onPlanSelect }: SubscriptionPlansProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest("POST", "/api/subscription/subscribe", { planId });
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Redirect to payment processor
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) return;
    
    setSelectedPlan(planId);
    if (onPlanSelect) {
      onPlanSelect(planId);
    } else {
      subscribeMutation.mutate(planId);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "premium":
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case "business":
        return <Building className="h-6 w-6 text-purple-500" />;
      default:
        return <Zap className="h-6 w-6 text-blue-500" />;
    }
  };

  const getPlanBadge = (planId: string) => {
    if (planId === currentPlan) {
      return <Badge variant="secondary">Current Plan</Badge>;
    }
    if (planId === "premium") {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Most Popular</Badge>;
    }
    if (planId === "business") {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Best Value</Badge>;
    }
    return null;
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {PLANS.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative transition-all duration-200 hover:shadow-lg ${
            plan.id === currentPlan 
              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" 
              : plan.id === "premium" 
              ? "border-yellow-200 dark:border-yellow-800" 
              : ""
          }`}
        >
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getPlanIcon(plan.id)}
            </div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            {getPlanBadge(plan.id)}
            <div className="mt-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-gray-500 dark:text-gray-400">/{plan.interval}</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={() => handleSelectPlan(plan.id)}
              disabled={plan.id === currentPlan || subscribeMutation.isPending}
              className={`w-full ${
                plan.id === "premium" 
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
                  : plan.id === "business"
                  ? "bg-purple-500 hover:bg-purple-600 text-white"
                  : ""
              }`}
              variant={plan.id === currentPlan ? "secondary" : "default"}
            >
              {subscribeMutation.isPending && selectedPlan === plan.id
                ? "Processing..."
                : plan.id === currentPlan
                ? "Current Plan"
                : plan.id === "free"
                ? "Downgrade"
                : "Upgrade Now"
              }
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}