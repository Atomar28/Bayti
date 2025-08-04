import { Button } from "@/components/ui/button";
import { Phone, Bell, Menu } from "lucide-react";

interface HeaderProps {
  currentPage: string;
}

export default function Header({ currentPage }: HeaderProps) {
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
            <h2 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">
              {currentPage}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
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
          </div>
        </div>
      </div>
    </header>
  );
}
