import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CallLogs from "@/pages/call-logs";
import Leads from "@/pages/leads";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/call-logs" component={CallLogs} />
      <Route path="/leads" component={Leads} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // If not logged in, redirect to landing page
  if (!isLoading && !isLoggedIn) {
    window.location.href = '/landing';
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">B<span className="text-blue-600 font-extrabold">A</span>yt<span className="text-blue-600 font-extrabold">I</span></h2>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen bg-gray-50 relative">
          {/* Unified Logo spanning across sidebar and header */}
          <div className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-6 bg-white/95 backdrop-blur-lg border-b border-white/20 shadow-beautiful">
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

          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <div className="flex-1 overflow-hidden">
            <Header currentPage={currentPage} />
            <main className="flex-1 relative overflow-y-auto focus:outline-none h-full">
              {/* Content with slide-in animation from sidebar */}
              <div className="h-full relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none"></div>
                <div className="h-full page-enter-animation">
                  <Router />
                </div>
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
