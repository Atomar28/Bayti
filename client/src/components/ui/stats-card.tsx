import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export default function StatsCard({ title, value, icon: Icon, iconColor, iconBgColor }: StatsCardProps) {
  return (
    <Card className="glass-card border-0 shadow-beautiful-lg hover:shadow-beautiful-lg hover:scale-105 transition-all duration-300 group">
      <CardContent className="p-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className={`w-14 h-14 ${iconBgColor} rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
              <Icon className={`${iconColor} w-7 h-7`} />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900 tracking-tight">{value}</div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
            <div className="mt-2 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
