import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AICall {
  id: string;
  caller_number: string;
  transcription: string;
  ai_response: string;
  call_status: string;
  created_at: string;
}

export function AICallLogs() {
  const { data: aiCallsData, isLoading: callsLoading } = useQuery({
    queryKey: ["/api/ai/call-logs"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const aiCalls = (aiCallsData as any)?.calls || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "incoming":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (callsLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">AI Call Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              AI Call Logs
            </div>
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            View all <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {aiCalls.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-500 mb-4">No AI calls yet</p>
            <p className="text-sm text-gray-400">
              Start a test call to see AI interactions here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {aiCalls.slice(0, 5).map((call: AICall) => (
              <div key={call.id} className="p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{call.caller_number}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {call.created_at ? formatDistanceToNow(new Date(call.created_at), { addSuffix: true }) : "Unknown time"}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(call.call_status)} font-medium px-3 py-1`}>
                    {formatStatus(call.call_status)}
                  </Badge>
                </div>
                
                {call.transcription && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <MessageSquare className="w-3 h-3 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">Customer:</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                      {call.transcription.length > 100 
                        ? `${call.transcription.substring(0, 100)}...` 
                        : call.transcription}
                    </p>
                  </div>
                )}
                
                {call.ai_response && (
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-xs font-medium text-blue-600">Bayti AI:</span>
                    </div>
                    <p className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                      {call.ai_response.length > 100 
                        ? `${call.ai_response.substring(0, 100)}...` 
                        : call.ai_response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}