import { Button } from "@/components/ui/button";
import { Phone, Bell, Menu, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  currentPage: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('demoMode');
    window.location.href = '/landing';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            {/* Logo for mobile and desktop */}
            <div className="flex items-center ml-2 md:ml-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.41l7 7V20h-2v-6h-6v6H9v-8.59l3-3z"/>
                </svg>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900">B<span className="text-blue-600 font-extrabold">A</span>yt<span className="text-blue-600 font-extrabold">I</span></h1>
                <p className="text-xs text-gray-500 -mt-1">Smart Calling Agent</p>
              </div>
            </div>
            
            <h2 className="ml-4 text-lg font-semibold text-gray-900 md:hidden">
              {currentPage}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Agent Manager'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
