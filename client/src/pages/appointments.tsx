import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AICallLogs } from "@/components/ai/AICallLogs";
import AppointmentsTab from "@/components/appointments/AppointmentsTab";

export default function AppointmentsCallbacks() {
  const { data: recentCallsData, isLoading: callsLoading } = useQuery({
    queryKey: ["/api/call-logs", { page: 1, limit: 5 }],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const recentCalls = (recentCallsData as any)?.callLogs || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualified":
        return "bg-green-100 text-green-800";
      case "no_answer":
        return "bg-red-100 text-red-800";
      case "follow_up":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Appointments & Callbacks</h1>
          <p className="mt-1 text-lg text-gray-600">Manage your scheduled appointments and review AI call activity</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Call Logs Section */}
          <div className="space-y-6">
            <AICallLogs />
          </div>
          
          {/* Recent Activity Section */}
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-gray-900">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl transition-all duration-200">
                  View all <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {callsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentCalls.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent calls</p>
              ) : (
                <div className="space-y-4">
                  {recentCalls.map((call: any) => (
                    <div key={call.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-4 ${
                          call.status === 'qualified' ? 'bg-emerald-400' :
                          call.status === 'no_answer' ? 'bg-red-400' : 'bg-amber-400'
                        }`}></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{call.phoneNumber}</p>
                          <p className="text-xs text-gray-500">
                            {call.startTime ? formatDistanceToNow(new Date(call.startTime), { addSuffix: true }) : "Unknown time"}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(call.status)} font-medium px-3 py-1`}>
                        {formatStatus(call.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointments Management Section */}
        <div className="mt-12">
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Calendar className="w-6 h-6 text-blue-600" />
                Scheduled Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentsTab />
            </CardContent>
          </Card>
        </div>

        {/* Extra spacing for scrollability */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}