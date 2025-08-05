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
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="8" r="2" fill="currentColor" opacity="0.6" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">Bayt<span className="text-blue-600 font-extrabold">AI</span></h1>
              <p className="text-xs text-gray-500 -mt-1">Smart Calling Agent</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                      active
                        ? "bg-brand-50 border-r-2 border-brand-500 text-brand-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setCurrentPage(item.name)}
                  >
                    <Icon
                      className={`mr-3 w-4 h-4 ${
                        active ? "text-brand-500" : "text-gray-400"
                      }`}
                    />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* Marketing Landing Page Link */}
          <div className="px-2 pb-4 border-t border-gray-200 pt-4">
            <a 
              href="/landing" 
              target="_blank"
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
            >
              <svg className="mr-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Landing Page
              <svg className="ml-auto w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600 w-4 h-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Agent John</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
