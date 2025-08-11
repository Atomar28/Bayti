import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Calendar, ChevronRight, Clock, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function AppointmentsCallbacks() {
  const [activeTab, setActiveTab] = useState("callbacks");

  // Fetch callback data (calls that need follow-up)
  const { data: callbacksData, isLoading: callbacksLoading } = useQuery({
    queryKey: ["/api/call-logs", { page: 1, limit: 20, status: "follow_up" }],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch appointments data
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/v1/appointments"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const callbacks = (callbacksData as any)?.callLogs || [];
  const appointments = appointmentsData || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualified":
      case "scheduled":
        return "bg-green-100 text-green-800";
      case "no_answer":
      case "missed":
        return "bg-red-100 text-red-800";
      case "follow_up":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const CallbackCard = ({ callback }: { callback: any }) => (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{callback.phoneNumber}</h3>
              <p className="text-sm text-gray-500">
                {callback.startTime ? formatDistanceToNow(new Date(callback.startTime), { addSuffix: true }) : "Unknown time"}
              </p>
            </div>
          </div>
          <Badge className={`${getStatusColor(callback.status)} font-medium`}>
            {formatStatus(callback.status)}
          </Badge>
        </div>
        
        {callback.outcome && (
          <p className="text-sm text-gray-600 mb-4">{callback.outcome}</p>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Duration: {callback.duration ? `${Math.floor(callback.duration / 60)}:${(callback.duration % 60).toString().padStart(2, '0')}` : "N/A"}
          </div>
          <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            Call Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const AppointmentCard = ({ appointment }: { appointment: any }) => (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{appointment.contactName || appointment.phone}</h3>
              <p className="text-sm text-gray-500 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {appointment.scheduledAt ? format(new Date(appointment.scheduledAt), "MMM dd, yyyy 'at' h:mm a") : "Time not set"}
              </p>
            </div>
          </div>
          <Badge className={`${getStatusColor(appointment.status || 'scheduled')} font-medium`}>
            {formatStatus(appointment.status || 'scheduled')}
          </Badge>
        </div>
        
        {appointment.notes && (
          <p className="text-sm text-gray-600 mb-4">{appointment.notes}</p>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center">
            <User className="w-3 h-3 mr-1" />
            {appointment.phone}
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
              Confirm
            </Button>
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              Reschedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Appointments & Callbacks</h1>
          <p className="mt-1 text-lg text-gray-600">Manage your scheduled appointments and callback queue</p>
        </div>

        {/* Tabs Section */}
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-gray-50 rounded-t-lg">
                <TabsTrigger 
                  value="callbacks" 
                  className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Callbacks ({callbacks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="appointments" 
                  className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Appointments ({appointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="callbacks" className="p-6 mt-0">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Callback Queue</h2>
                  <p className="text-gray-600">Prospects that need follow-up calls</p>
                </div>

                {callbacksLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-40 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : callbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No callbacks scheduled</p>
                    <p className="text-gray-400">All caught up with follow-ups!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {callbacks.map((callback: any) => (
                      <CallbackCard key={callback.id} callback={callback} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="appointments" className="p-6 mt-0">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Scheduled Appointments</h2>
                  <p className="text-gray-600">Confirmed meetings and consultations</p>
                </div>

                {appointmentsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-40 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No appointments scheduled</p>
                    <p className="text-gray-400">Start making calls to book meetings!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {appointments.map((appointment: any) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Extra spacing for scrollability */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}