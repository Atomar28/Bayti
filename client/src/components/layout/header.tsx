import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, Menu, LogOut, User, Phone, Calendar, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  currentPage: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch recent notifications from call logs and appointments
  const { data: recentCallsData } = useQuery({
    queryKey: ["/api/ai/call-logs"],
    refetchInterval: 30000,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["/api/v1/appointments"],
    refetchInterval: 30000,
  });

  // Generate notifications from recent activity
  const generateNotifications = () => {
    const notifications: Array<{
      id: string;
      type: 'success' | 'info' | 'upcoming';
      title: string;
      message: string;
      time: string;
      icon: any;
    }> = [];
    const calls = (recentCallsData as any)?.calls || [];
    const appointments = (appointmentsData as any) || [];

    // Recent qualified calls
    const recentQualifiedCalls = calls
      .filter((call: any) => call.call_status === 'qualified')
      .slice(0, 3);

    recentQualifiedCalls.forEach((call: any) => {
      notifications.push({
        id: `call-${call.id}`,
        type: 'success',
        title: 'New Appointment Booked',
        message: `Call from ${call.caller_number} resulted in appointment`,
        time: call.created_at,
        icon: Calendar
      });
    });

    // Recent completed calls
    const recentCompletedCalls = calls
      .filter((call: any) => call.call_status === 'completed')
      .slice(0, 2);

    recentCompletedCalls.forEach((call: any) => {
      notifications.push({
        id: `call-completed-${call.id}`,
        type: 'info', 
        title: 'Call Completed',
        message: `${call.duration}s call from ${call.caller_number}`,
        time: call.created_at,
        icon: Phone
      });
    });

    // Upcoming appointments
    const upcomingAppointments = appointments
      .filter((apt: any) => new Date(apt.scheduledTime) > new Date())
      .slice(0, 2);

    upcomingAppointments.forEach((apt: any) => {
      notifications.push({
        id: `apt-${apt.id}`,
        type: 'upcoming',
        title: 'Upcoming Appointment',
        message: `Callback scheduled with ${apt.customerName}`,
        time: apt.scheduledTime,
        icon: Calendar
      });
    });

    return notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  };

  const notifications = generateNotifications();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('demoMode');
    window.location.href = '/landing';
  };

  return (
    <header className="glass-card bg-white/95 backdrop-blur-lg shadow-beautiful border-b border-white/20 mt-20">
      <div className="px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between h-18">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            {/* Page Title */}
            <div className="ml-2 md:ml-0">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentPage}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="p-4 text-gray-400 hover:text-gray-500 relative rounded-full hover:bg-gray-100/80 transition-all duration-200"
                >
                  <Bell className="w-8 h-8" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-500">Recent activity and updates</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => {
                        const IconComponent = notification.icon;
                        return (
                          <div key={notification.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              <div className={`p-1 rounded-full ${
                                notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                notification.type === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                <IconComponent className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => setIsNotificationsOpen(false)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark all as read
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* User Menu - Enhanced and Bigger */}
            <div className="flex items-center space-x-5 pl-8 border-l border-gray-200/50">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-beautiful hover:shadow-beautiful-lg transition-all duration-300 ring-2 ring-white">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="hidden md:block space-y-1">
                  <p className="text-lg font-bold text-gray-900">{user?.name || 'Demo User'}</p>
                  <p className="text-sm text-gray-500 font-medium">{user?.role || 'Agent Manager'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleLogout}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
