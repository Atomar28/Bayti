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
    <header className="glass-card bg-white/95 backdrop-blur-lg shadow-beautiful border-b border-white/20 sticky top-0 z-50">
      <div className="px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            {/* Bayti Logo - Premium Design */}
            <div className="flex items-center ml-2 md:ml-0">
              <div className="relative w-14 h-14 mr-4 group">
                {/* Outer ring with gradient border */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-all duration-300"></div>
                {/* Inner background */}
                <div className="logo-shine relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-beautiful-lg group-hover:scale-105 transition-all duration-300">
                  {/* Custom Bayti Icon - Modern geometric house with AI elements */}
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V9.75a.75.75 0 00-.375-.65L12 7.5 8.25 9.1a.75.75 0 00-.375.65v11.25h4.5z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5l8.25 5.25v8.25H3.75V12.75L12 7.5z"/>
                    {/* AI brain pattern overlay */}
                    <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity="0.7"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.5 9.5c.5-.5 1.5-.5 2 0M10.5 12.5c.5.5 1.5.5 2 0" opacity="0.6"/>
                  </svg>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
                {/* Premium shine effect */}
                <div className="absolute top-2 left-2 w-3 h-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300"></div>
              </div>
              <div className="hidden md:block space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Bayti<span className="text-2xl">AI</span>
                </h1>
                <p className="text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                  Intelligent Call Center Platform
                </p>
              </div>
            </div>
            
            <div className="ml-4 md:hidden">
              <h2 className="text-xl font-bold gradient-text">{currentPage}</h2>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V9.75a.75.75 0 00-.375-.65L12 7.5 8.25 9.1a.75.75 0 00-.375.65v11.25h4.5z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5l8.25 5.25v8.25H3.75V12.75L12 7.5z"/>
                  <circle cx="12" cy="11" r="1" fill="currentColor" opacity="0.7"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-400 hover:text-gray-500 relative"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
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

            {/* User Menu - Enhanced */}
            <div className="flex items-center space-x-4 pl-6 border-l border-gray-200/50">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-beautiful">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block space-y-1">
                  <p className="text-base font-semibold text-gray-900">{user?.name || 'Demo User'}</p>
                  <p className="text-sm text-gray-500">{user?.role || 'Agent Manager'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
