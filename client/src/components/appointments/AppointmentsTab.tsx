import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Phone, Video, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@shared/schema";

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: string) => void;
}

function AppointmentCard({ appointment, onStatusUpdate }: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{appointment.title}</h3>
              <Badge className={getStatusColor(appointment.status)}>
                {formatStatus(appointment.status)}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(appointment.scheduledTime), "PPP")}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {format(new Date(appointment.scheduledTime), "p")} 
                  ({appointment.duration} min)
                </span>
              </div>
              
              {appointment.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{appointment.location}</span>
                </div>
              )}
              
              {appointment.meetingLink && (
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline">
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
            
            {appointment.description && (
              <p className="mt-3 text-sm text-gray-700">{appointment.description}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            {appointment.status === "scheduled" && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => onStatusUpdate(appointment.id, "completed")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark Complete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusUpdate(appointment.id, "cancelled")}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AppointmentsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/v1/appointments", { status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/v1/appointments/${id}`, {
        method: "PUT",
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/appointments"] });
      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const upcomingAppointments = appointments.filter((apt: Appointment) => 
    new Date(apt.scheduledTime) > new Date() && apt.status === "scheduled"
  );

  const pastAppointments = appointments.filter((apt: Appointment) => 
    new Date(apt.scheduledTime) <= new Date() || apt.status !== "scheduled"
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
        
        <div className="flex gap-2">
          {["all", "scheduled", "completed", "cancelled"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Appointments ({upcomingAppointments.length})
          </h3>
          
          <div className="space-y-4">
            {upcomingAppointments.map((appointment: Appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Past Appointments ({pastAppointments.length})
          </h3>
          
          <div className="space-y-4">
            {pastAppointments.map((appointment: Appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments scheduled</h3>
            <p className="text-gray-600">
              Appointments will appear here when they are booked through AI calls.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}