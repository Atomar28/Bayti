import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, Phone, Eye, User, Mail, DollarSign, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

export default function Leads() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["/api/leads"],
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/export/leads");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Leads have been exported to CSV.",
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export leads. Please try again.",
        variant: "destructive",
      });
    },
  });

  const leads = leadsData?.leads || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot":
        return "bg-green-100 text-green-800";
      case "warm":
        return "bg-yellow-100 text-yellow-800";
      case "cold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getInterestColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-yellow-500";
    if (level >= 40) return "bg-orange-500";
    return "bg-gray-400";
  };

  const getInterestLabel = (level: number) => {
    if (level >= 80) return "High Interest";
    if (level >= 60) return "Medium Interest";
    if (level >= 40) return "Low Interest";
    return "Unknown";
  };

  const formatLastContact = (date: string | null) => {
    if (!date) return "Never contacted";
    return `Last contacted ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Lead Management</h3>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white shadow-sm rounded-lg p-6 animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No leads found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {leads.map((lead: Lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="text-gray-600 w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{lead.name}</h4>
                      <p className="text-xs text-gray-500">{lead.company || "No company"}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(lead.status || "cold")}>
                    {getStatusLabel(lead.status || "cold")}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{lead.phoneNumber}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.budget && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>{lead.budget}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatLastContact(lead.lastContactDate)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Interest Level</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getInterestColor(lead.interestLevel || 0)}`}
                      style={{ width: `${lead.interestLevel || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getInterestLabel(lead.interestLevel || 0)} ({lead.interestLevel || 0}%)
                  </p>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button size="sm" className="flex-1 bg-brand-500 hover:bg-brand-600">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
