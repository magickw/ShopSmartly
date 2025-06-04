import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ScanHistory } from "@shared/schema";

export default function History() {
  const { data: scanHistory = [], isLoading } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
  });

  const groupedHistory = scanHistory.reduce((groups, scan) => {
    const date = new Date(scan.scannedAt!).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(scan);
    return groups;
  }, {} as Record<string, ScanHistory[]>);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="py-3 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scan History</h1>
        {scanHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearHistoryMutation.mutate()}
            disabled={clearHistoryMutation.isPending}
            className="text-gray-500 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="mt-6">
        {scanHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No scan history yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Start scanning products to see your history
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, scans]) => (
              <div key={date}>
                <h3 className="text-sm text-ios-gray font-medium mb-2">
                  {getDateLabel(date)}
                </h3>
                <div className="space-y-3">
                  {scans.map((scan) => (
                    <Link key={scan.id} href={`/product/${scan.barcode}`}>
                      <Card className="bg-white border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 flex items-center">
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-gray-500">IMG</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{scan.productName}</h4>
                            <p className="text-sm text-ios-gray">
                              {formatTime(new Date(scan.scannedAt!))}
                            </p>
                          </div>
                          <div className="text-right flex items-center">
                            <div className="mr-2">
                              <p className="text-sm font-medium text-ios-green">
                                {scan.bestPrice}
                              </p>
                              <p className="text-xs text-ios-gray">Best Price</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
