import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Phone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RotateCcw,
  Ban,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CampaignLead {
  id: string;
  fullName: string;
  phoneE164: string;
  email?: string;
  status: 'PENDING' | 'DIALING' | 'CONNECTED' | 'COMPLETED' | 'FAILED' | 'RETRY' | 'DO_NOT_CALL';
  attempts: number;
  lastError?: string;
  updatedAt: string;
}

interface CampaignTableProps {
  campaignId: string;
}

export function CampaignTable({ campaignId }: CampaignTableProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/leads`, { page, statusFilter, searchTerm }],
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });

  const suppressMutation = useMutation({
    mutationFn: (phoneE164: string) => apiRequest('/api/campaigns/suppression', {
      method: 'POST',
      body: JSON.stringify({
        phoneE164,
        reason: 'Manual suppression from campaign table'
      }),
    }),
    onSuccess: () => {
      toast({
        title: 'Number Suppressed',
        description: 'Phone number has been added to the Do Not Call list',
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/campaigns/${campaignId}/leads`] 
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Suppress Number',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string, attempts: number) => {
    const statusConfig = {
      PENDING: { color: 'secondary', icon: Clock, label: 'Pending' },
      DIALING: { color: 'default', icon: Phone, label: 'Dialing' },
      CONNECTED: { color: 'default', icon: Phone, label: 'Connected' },
      COMPLETED: { color: 'default', icon: CheckCircle, label: 'Completed' },
      FAILED: { color: 'destructive', icon: XCircle, label: 'Failed' },
      RETRY: { color: 'secondary', icon: RotateCcw, label: 'Retry' },
      DO_NOT_CALL: { color: 'destructive', icon: AlertTriangle, label: 'DNC' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.color} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
        {attempts > 0 && status !== 'PENDING' && (
          <span className="text-xs">({attempts})</span>
        )}
      </Badge>
    );
  };

  const formatPhoneNumber = (phoneE164: string) => {
    if (phoneE164.startsWith('+971')) {
      // UAE format
      const number = phoneE164.slice(4);
      return `+971 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
    }
    return phoneE164;
  };

  const leads = leadsData?.leads || [];
  const total = leadsData?.total || 0;
  const limit = 20;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Leads</CardTitle>
        <CardDescription>
          Manage and track individual leads in this campaign
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="DIALING">Dialing</SelectItem>
                <SelectItem value="CONNECTED">Connected</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="RETRY">Retry</SelectItem>
                <SelectItem value="DO_NOT_CALL">Do Not Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-current border-r-transparent rounded-full animate-spin mr-2" />
                        Loading leads...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead: CampaignLead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.fullName || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {formatPhoneNumber(lead.phoneE164)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.email && (
                          <span className="text-sm text-muted-foreground">
                            {lead.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(lead.status, lead.attempts)}
                          {lead.lastError && (
                            <div className="text-xs text-red-600 max-w-48 truncate" title={lead.lastError}>
                              {lead.lastError}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(lead.updatedAt).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.status !== 'DO_NOT_CALL' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => suppressMutation.mutate(lead.phoneE164)}
                            disabled={suppressMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Ban className="h-3 w-3" />
                            DNC
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} leads
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}