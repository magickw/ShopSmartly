import { Signal, Wifi, Battery } from "lucide-react";

export default function StatusBar() {
  const currentTime = new Date().toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  return (
    <div className="flex justify-between items-center px-4 py-2 text-xs font-medium">
      <span>{currentTime}</span>
      <div className="flex items-center space-x-1">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <Battery className="h-3 w-3" />
      </div>
    </div>
  );
}
