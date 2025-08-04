import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export default function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white shadow-sm rounded-lg p-6 animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Call Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Call Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-2" />
                <p>Call Volume Chart</p>
                <p className="text-sm">Chart.js integration needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-16 h-16 mx-auto mb-2" />
                <p>Success Rate Chart</p>
                <p className="text-sm">Chart.js integration needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Response Time</span>
                <span className="text-sm font-medium text-gray-900">2.3 seconds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Call Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">78%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lead Qualification Rate</span>
                <span className="text-sm font-medium text-gray-900">{(stats as any)?.successRate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Call Duration</span>
                <span className="text-sm font-medium text-gray-900">4:32</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Callback Request Rate</span>
                <span className="text-sm font-medium text-gray-900">12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Periods */}
        <Card>
          <CardHeader>
            <CardTitle>Best Calling Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">2:00 PM - 4:00 PM</span>
                  <p className="text-xs text-gray-500">Highest success rate</p>
                </div>
                <span className="text-sm font-semibold text-green-600">34%</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">10:00 AM - 12:00 PM</span>
                  <p className="text-xs text-gray-500">Most calls completed</p>
                </div>
                <span className="text-sm font-semibold text-green-600">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Tuesday - Thursday</span>
                  <p className="text-xs text-gray-500">Best days of week</p>
                </div>
                <span className="text-sm font-semibold text-green-600">31%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
