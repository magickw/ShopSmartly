import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, AlertTriangle, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SubscriptionPlans from "./SubscriptionPlans";

interface ScanLimitBannerProps {
  onUpgrade?: () => void;
}

export default function ScanLimitBanner({ onUpgrade }: ScanLimitBannerProps) {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  if (!subscriptionStatus || !user) return null;

  const { tier, scanLimits } = subscriptionStatus;
  const isFreeTier = tier === "free" || !tier;
  
  if (!isFreeTier) return null; // Only show for free tier users

  const scansUsed = scanLimits?.scansUsed || 0;
  const dailyLimit = scanLimits?.dailyLimit || 10;
  const scansRemaining = Math.max(0, dailyLimit - scansUsed);
  const usagePercentage = (scansUsed / dailyLimit) * 100;

  const resetTime = scanLimits?.resetTime ? new Date(scanLimits.resetTime) : null;
  const hoursUntilReset = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60)) : 24;

  // Show critical warning when 80% used or no scans left
  const isCritical = usagePercentage >= 80 || scansRemaining === 0;

  if (showUpgrade) {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowUpgrade(false)}
          >
            ×
          </Button>
        </div>
        <SubscriptionPlans 
          currentPlan={tier}
          onPlanSelect={() => {
            setShowUpgrade(false);
            onUpgrade?.();
          }}
        />
      </div>
    );
  }

  return (
    <Alert className={`mb-4 ${isCritical ? 'border-red-200 bg-red-50 dark:bg-red-950' : 'border-orange-200 bg-orange-50 dark:bg-orange-950'}`}>
      <div className="flex items-start gap-3">
        {isCritical ? (
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        ) : (
          <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">
                {scansRemaining === 0 ? "Daily Scan Limit Reached" : "Scan Usage"}
              </h4>
              <AlertDescription className="mt-1">
                {scansRemaining === 0 ? (
                  `You've used all ${dailyLimit} daily scans. Resets in ${hoursUntilReset} hours.`
                ) : (
                  `${scansRemaining} of ${dailyLimit} scans remaining today`
                )}
              </AlertDescription>
            </div>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Free Plan
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${isCritical ? 'bg-red-100' : 'bg-orange-100'}`}
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{scansUsed} used</span>
              <span>{dailyLimit} limit</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowUpgrade(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade for Unlimited
            </Button>
            
            {scansRemaining === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Check Reset Time
              </Button>
            )}
          </div>

          {/* Upgrade Benefits */}
          {isCritical && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
              <h5 className="font-medium text-sm mb-2">Premium Benefits:</h5>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Unlimited daily scans</li>
                <li>• Advanced price alerts</li>
                <li>• Extended scan history</li>
                <li>• Priority support</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}