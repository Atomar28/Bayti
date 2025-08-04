import { Link, useLocation } from "wouter";
import { Phone, ChartLine, PhoneIcon, Users, BarChart3, Settings, User } from "lucide-react";

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
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Phone className="text-white w-4 h-4" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900">DARI AI</h1>
          </div>
        </div>
        
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
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
                  </a>
                </Link>
              );
            })}
          </nav>
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
