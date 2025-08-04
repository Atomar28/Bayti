import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, UserPlus, Clock, Percent } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: recentCallsData, isLoading: callsLoading } = useQuery({
    queryKey: ["/api/call-logs", { page: 1, limit: 5 }],
  });

  const { data: scriptsData, isLoading: scriptsLoading } = useQuery({
    queryKey: ["/api/call-scripts"],
  });

  const recentCalls = recentCallsData?.callLogs || [];
  const scripts = scriptsData || [];

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (statsLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Calls Today"
          value={stats?.totalCallsToday || 0}
          icon={Phone}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Qualified Leads"
          value={stats?.qualifiedLeads || 0}
          icon={UserPlus}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Avg Call Duration"
          value={stats?.avgDuration ? formatDuration(stats.avgDuration) : "0:00"}
          icon={Clock}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={Percent}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
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
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        call.status === 'qualified' ? 'bg-green-400' :
                        call.status === 'no_answer' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{call.phoneNumber}</p>
                        <p className="text-xs text-gray-500">
                          {call.startTime ? formatDistanceToNow(new Date(call.startTime), { addSuffix: true }) : "Unknown time"}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(call.status)}>
                      {formatStatus(call.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Scripts Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {scriptsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : scripts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No call scripts available</p>
            ) : (
              <div className="space-y-4">
                {scripts.slice(0, 3).map((script) => (
                  <div key={script.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{script.name}</p>
                      <p className="text-xs text-gray-500">{script.description || "No description"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">--</p>
                      <p className="text-xs text-gray-500">success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
