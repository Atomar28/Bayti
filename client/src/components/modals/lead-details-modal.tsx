import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Building, DollarSign, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Lead } from "@shared/schema";

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function LeadDetailsModal({ isOpen, onClose, lead }: LeadDetailsModalProps) {
  if (!lead) return null;

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

  const getInterestColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-yellow-500";
    if (level >= 40) return "bg-orange-500";
    return "bg-gray-400";
  };

  const getInterestLabel = (level: number) => {
    if (level >= 80) return "High";
    if (level >= 60) return "Medium";
    if (level >= 40) return "Low";
    return "Unknown";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <p className="text-sm text-gray-900">{lead.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <p className="text-sm text-gray-900">{lead.company || "Not specified"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="flex items-center text-sm text-gray-900">
                <Phone className="w-4 h-4 mr-2" />
                {lead.phoneNumber}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center text-sm text-gray-900">
                <Mail className="w-4 h-4 mr-2" />
                {lead.email || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
              <div className="flex items-center text-sm text-gray-900">
                <DollarSign className="w-4 h-4 mr-2" />
                {lead.budget || "Not specified"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Level</label>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getInterestColor(lead.interestLevel || 0)}`}
                    style={{ width: `${lead.interestLevel || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {getInterestLabel(lead.interestLevel || 0)} ({lead.interestLevel || 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <p className="text-sm text-gray-900">{lead.industry || "Not specified"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <p className="text-sm text-gray-900">{lead.companySize || "Not specified"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Badge className={getStatusColor(lead.status || "cold")}>
                {(lead.status || "cold").charAt(0).toUpperCase() + (lead.status || "cold").slice(1)}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact</label>
              <div className="flex items-center text-sm text-gray-900">
                <Calendar className="w-4 h-4 mr-2" />
                {lead.lastContactDate 
                  ? format(new Date(lead.lastContactDate), "MMM dd, yyyy") 
                  : "Never contacted"}
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                {lead.notes}
              </div>
            </div>
          )}

          {/* Call History Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Call History</label>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500 text-center">
                Call history integration pending
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-brand-500 hover:bg-brand-600">
            <Phone className="w-4 h-4 mr-2" />
            Call Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
