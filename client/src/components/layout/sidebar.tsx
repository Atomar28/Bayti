import { Link, useLocation } from "wouter";
import { Phone, ChartLine, PhoneIcon, Users, BarChart3, Settings, User, Home, Megaphone } from "lucide-react";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Appointments/Callbacks", href: "/appointments", icon: PhoneIcon },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Auto-Dial Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="hidden md:flex md:w-80 md:flex-col">
      <div className="flex flex-col flex-grow pt-20 overflow-y-auto glass-card bg-white/95 backdrop-blur-lg border-r border-white/20 shadow-beautiful relative">
        
        {/* Visual connection line from logo area */}
        <div className="absolute top-0 left-6 w-px h-20 bg-gradient-to-b from-blue-500/50 to-transparent"></div>
        
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-6 pb-6 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`group flex items-center px-5 py-4 text-lg font-semibold rounded-2xl cursor-pointer transition-all duration-300 relative ${
                      active
                        ? "glass-card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 text-blue-700 shadow-beautiful-sm scale-105"
                        : "text-gray-600 hover:glass-card hover:bg-gray-50/80 hover:text-gray-900 hover:scale-105 hover:shadow-beautiful-sm"
                    }`}
                    onClick={() => setCurrentPage(item.name)}
                  >
                    <Icon
                      className={`mr-4 w-6 h-6 transition-colors duration-300 ${
                        active ? "text-blue-500" : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                    <span className="tracking-wide">{item.name}</span>
                    
                    {/* Active page connection indicator */}
                    {active && (
                      <>
                        {/* Right edge indicator with pulse */}
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full shadow-lg connection-pulse"></div>
                        {/* Connection line extending to main content */}
                        <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-8 h-px bg-gradient-to-r from-blue-500/70 via-blue-400/50 to-transparent"></div>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* Marketing Landing Page Link - Enhanced */}
          <div className="px-6 pb-6 border-t border-gray-200/50 pt-6">
            <a 
              href="/landing" 
              target="_blank"
              className="group flex items-center px-5 py-4 text-base font-medium rounded-2xl text-gray-600 hover:glass-card hover:bg-gray-50/80 hover:text-gray-900 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-beautiful-sm"
            >
              <svg className="mr-4 w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="tracking-wide">Landing Page</span>
              <svg className="ml-auto w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="text-white w-5 h-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-900">Agent John</p>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <p className="text-xs text-green-600 font-medium">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
