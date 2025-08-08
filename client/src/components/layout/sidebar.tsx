import { Link, useLocation } from "wouter";
import { Phone, ChartLine, PhoneIcon, Users, BarChart3, Settings, User, Home } from "lucide-react";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Call Logs", href: "/call-logs", icon: PhoneIcon },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
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
      <div className="flex flex-col flex-grow pt-8 overflow-y-auto glass-card bg-white/95 backdrop-blur-lg border-r border-white/20 shadow-beautiful">

        {/* BaytiAI Logo in Sidebar */}
        <div className="px-6 mb-8">
          <div className="flex items-center">
            <div className="relative w-12 h-12 mr-3 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-2xl opacity-90 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="logo-shine relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-beautiful-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V9.75a.75.75 0 00-.375-.65L12 7.5 8.25 9.1a.75.75 0 00-.375.65v11.25h4.5z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5l8.25 5.25v8.25H3.75V12.75L12 7.5z"/>
                  <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity="0.7"/>
                </svg>
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </div>
              <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                BaytiAI
              </h1>
              <p className="text-xs font-medium bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                Intelligent Call Center
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-6 pb-6 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`group flex items-center px-5 py-4 text-lg font-semibold rounded-2xl cursor-pointer transition-all duration-300 ${
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
