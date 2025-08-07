import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, UserPlus, Clock, Percent, TrendingUp, Users, Calendar, Play, Settings, ChevronRight, Zap, FileText, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TestCallDialog } from "@/components/ai/TestCallDialog";
import { AICallLogs } from "@/components/ai/AICallLogs";
import AppointmentsTab from "@/components/appointments/AppointmentsTab";
import ProjectScriptsTab from "@/components/scripts/ProjectScriptsTab";
import SettingsTab from "@/components/settings/SettingsTab";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    refetchOnWindowFocus: true,
  });

  const { data: recentCallsData, isLoading: callsLoading } = useQuery({
    queryKey: ["/api/call-logs", { page: 1, limit: 5 }],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    refetchOnWindowFocus: true,
  });

  const { data: scriptsData, isLoading: scriptsLoading } = useQuery({
    queryKey: ["/api/call-scripts"],
    refetchInterval: 60000, // Refresh every minute (scripts change less frequently)
  });

  const recentCalls = (recentCallsData as any)?.callLogs || [];
  const scripts = (scriptsData as any) || [];

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
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, Agent John</h1>
              <p className="mt-1 text-lg text-gray-600">Here's your call center overview for today</p>
            </div>
            <div className="flex items-center space-x-4">
              <TestCallDialog>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Test Call
                </Button>
              </TestCallDialog>
              <Button variant="outline" className="px-6 py-3 rounded-lg border-gray-300 hover:bg-gray-50 transition-all duration-200">
                <Settings className="w-4 h-4 mr-2" />
                Quick Setup
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Scripts
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Call Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title={(stats as any)?.totalCallsToday > 0 ? "Total Calls Today" : "Recent Calls"}
          value={(stats as any)?.totalCallsToday || 0}
          icon={Phone}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Qualified Leads"
          value={(stats as any)?.qualifiedLeads || 0}
          icon={UserPlus}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
        />
        <StatsCard
          title="Avg Call Duration"
          value={(stats as any)?.avgDuration ? formatDuration((stats as any).avgDuration) : "0:00"}
          icon={Clock}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
        />
        <StatsCard
          title="Success Rate"
          value={`${(stats as any)?.successRate || 0}%`}
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI Agent Status</h3>
                  <p className="text-blue-100">All systems operational</p>
                  <div className="flex items-center mt-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm">Online & Ready</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Active Campaigns</h3>
                  <p className="text-emerald-100">3 campaigns running</p>
                  <div className="flex items-center mt-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Real Estate Focus</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Today's Goal</h3>
                  <p className="text-amber-100">{(stats as any)?.qualifiedLeads || 0} / 25 qualified leads</p>
                  <div className="flex items-center mt-3">
                    <div className="flex-1 bg-white/20 rounded-full h-2 mr-2">
                      <div className="bg-white h-2 rounded-full" style={{width: `${Math.min(((stats as any)?.qualifiedLeads || 0) / 25 * 100, 100)}%`}}></div>
                    </div>
                    <span className="text-sm">{Math.min(Math.round(((stats as any)?.qualifiedLeads || 0) / 25 * 100), 100)}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Call Logs Section */}
        <AICallLogs />
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Recent Calls</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
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

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">AI Call Scripts</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scriptsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : scripts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-500 mb-4">No call scripts configured</p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create Script
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scripts.slice(0, 3).map((script: any) => (
                  <div key={script.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{script.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{script.description || "AI-powered real estate script"}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold text-emerald-600">85%</p>
                      <p className="text-xs text-gray-500">success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <AppointmentsTab />
          </TabsContent>

          {/* Project Scripts Tab */}
          <TabsContent value="scripts">
            <ProjectScriptsTab />
          </TabsContent>

          {/* Call Logs Tab */}
          <TabsContent value="calls">
            <AICallLogs />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
