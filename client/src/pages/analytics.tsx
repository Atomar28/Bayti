import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Phone, Clock, Target, BarChart3 } from "lucide-react";

// Sample data for charts - in real implementation, this would come from API
const callVolumeData = [
  { time: "9:00 AM", calls: 2 },
  { time: "10:00 AM", calls: 4 },
  { time: "11:00 AM", calls: 3 },
  { time: "12:00 PM", calls: 1 },
  { time: "1:00 PM", calls: 2 },
  { time: "2:00 PM", calls: 5 },
  { time: "3:00 PM", calls: 3 },
  { time: "4:00 PM", calls: 2 },
];

const successRateData = [
  { time: "9:00 AM", rate: 65 },
  { time: "10:00 AM", rate: 72 },
  { time: "11:00 AM", rate: 68 },
  { time: "12:00 PM", rate: 45 },
  { time: "1:00 PM", rate: 55 },
  { time: "2:00 PM", rate: 78 },
  { time: "3:00 PM", rate: 82 },
  { time: "4:00 PM", rate: 75 },
];

const bestTimesData = [
  { period: "10:00 AM - 11:00 AM", successRate: 75, calls: 12 },
  { period: "2:00 PM - 3:00 PM", successRate: 78, calls: 8 },
  { period: "3:00 PM - 4:00 PM", successRate: 82, calls: 6 },
  { period: "Tuesday - Thursday", successRate: 71, calls: 28 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ["/api/ai/call-logs"],
    refetchInterval: 30000,
  });

  // Process real call data for analytics
  const processCallData = () => {
    if (!callsData || !(callsData as any)?.calls) return { hourlyData: [], dailyData: [] };
    
    const calls = (callsData as any).calls;
    const hourlyMap = new Map();
    const dailyMap = new Map();
    
    calls.forEach((call: any) => {
      const date = new Date(call.timestamp || call.createdAt);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Hourly data
      const hourKey = `${hour}:00`;
      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { calls: 0, successful: 0 });
      }
      const hourData = hourlyMap.get(hourKey);
      hourData.calls++;
      if (call.status === 'qualified' || call.status === 'completed') {
        hourData.successful++;
      }
      
      // Daily data
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { calls: 0, successful: 0 });
      }
      const dayData = dailyMap.get(day);
      dayData.calls++;
      if (call.status === 'qualified' || call.status === 'completed') {
        dayData.successful++;
      }
    });
    
    const hourlyData = Array.from(hourlyMap.entries()).map(([time, data]) => ({
      time,
      calls: data.calls,
      rate: data.calls > 0 ? Math.round((data.successful / data.calls) * 100) : 0
    })).sort((a, b) => parseInt(a.time) - parseInt(b.time));
    
    const dailyData = Array.from(dailyMap.entries()).map(([day, data]) => ({
      day,
      calls: data.calls,
      rate: data.calls > 0 ? Math.round((data.successful / data.calls) * 100) : 0
    }));
    
    return { hourlyData, dailyData };
  };

  const { hourlyData, dailyData } = processCallData();

  if (statsLoading || callsLoading) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-80">
                  <div className="h-full bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-lg text-gray-600">Track your AI calling performance and optimize your strategy</p>
        </div>

        {/* Top Row - Call Volume and Success Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Call Volume Trends */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Call Volume Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData.length > 0 ? hourlyData : callVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calls" fill="#3B82F6" name="Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate by Hour */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Success Rate by Hour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData.length > 0 ? hourlyData : successRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Success Rate (%)"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Performance Metrics and Best Times */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Current Success Rate</span>
                <span className="text-xl font-bold text-green-600">{(stats as any)?.successRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Lead Qualification Rate</span>
                <span className="text-xl font-bold text-blue-600">
                  {(stats as any)?.totalCallsToday > 0 ? 
                    Math.round(((stats as any)?.qualifiedLeads / (stats as any)?.totalCallsToday) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Average Call Duration</span>
                <span className="text-xl font-bold text-amber-600">
                  {(stats as any)?.avgDuration ? 
                    `${Math.floor((stats as any).avgDuration / 60)}:${((stats as any).avgDuration % 60).toString().padStart(2, '0')}` : 
                    '0:00'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Callbacks Success Rate</span>
                <span className="text-xl font-bold text-purple-600">68%</span>
              </div>
            </CardContent>
          </Card>

          {/* Best Calling Times */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Best Calling Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bestTimesData.map((period, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{period.period}</p>
                      <p className="text-sm text-gray-500">{period.calls} calls</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                        {period.successRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extra spacing for scrollability */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}