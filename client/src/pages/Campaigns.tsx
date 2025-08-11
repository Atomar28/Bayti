import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Play, 
  Pause, 
  Square, 
  Phone, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { CampaignUpload } from '@/components/CampaignUpload';
import { CampaignControls } from '@/components/CampaignControls';
import { CampaignTable } from '@/components/CampaignTable';

interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'DONE';
  createdAt: string;
}

interface CampaignSummary {
  campaign: Campaign;
  leads: {
    total: number;
    pending: number;
    dialing: number;
    connected: number;
    completed: number;
    failed: number;
    retry: number;
    doNotCall: number;
  };
  progress: number;
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

export default function Campaigns() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  
  // Fetch campaigns list
  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ['/api/campaigns'],
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });

  // Fetch selected campaign summary
  const { data: campaignSummary, refetch: refetchSummary } = useQuery({
    queryKey: [`/api/campaigns/${selectedCampaignId}/summary`],
    enabled: !!selectedCampaignId,
    refetchInterval: 5000, // More frequent updates for active campaigns
  });

  const campaigns = campaignsData?.campaigns || [];
  const activeCampaign = campaigns.find((c: Campaign) => c.id === selectedCampaignId);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'secondary', icon: Clock },
      RUNNING: { color: 'default', icon: Play },
      PAUSED: { color: 'secondary', icon: Pause },
      STOPPED: { color: 'destructive', icon: Square },
      DONE: { color: 'secondary', icon: CheckCircle },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <Badge variant={config.color} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getLeadStatusIcon = (status: string) => {
    const iconMap = {
      PENDING: Clock,
      DIALING: Phone,
      CONNECTED: Phone,
      COMPLETED: CheckCircle,
      FAILED: XCircle,
      RETRY: RotateCcw,
      DO_NOT_CALL: AlertTriangle,
    } as const;

    return iconMap[status as keyof typeof iconMap] || Clock;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto-Dial Campaigns</h1>
          <p className="text-muted-foreground">
            Manage automated calling campaigns and track performance
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          {selectedCampaignId && (
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active campaigns in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Running Campaigns</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns.filter((c: Campaign) => c.status === 'RUNNING').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignSummary ? campaignSummary.leads.total : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignSummary && campaignSummary.leads.total > 0
                    ? Math.round((campaignSummary.leads.completed / campaignSummary.leads.total) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Calls completed successfully
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>
                Select a campaign to view details and manage calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {campaigns.map((campaign: Campaign) => (
                  <Card 
                    key={campaign.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCampaignId === campaign.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(campaign.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No campaigns found. Create your first campaign to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {campaignSummary && activeCampaign && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{activeCampaign.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(activeCampaign.status)}
                    <span className="text-sm text-muted-foreground">
                      {campaignSummary.progress}% complete
                    </span>
                  </div>
                </div>
                <CampaignControls
                  campaignId={selectedCampaignId!}
                  status={activeCampaign.status}
                  onStatusChange={() => {
                    refetchSummary();
                    refetchCampaigns();
                  }}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lead Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={campaignSummary.progress} className="w-full" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(campaignSummary.leads).map(([status, count]) => {
                        if (status === 'total') return null;
                        const Icon = getLeadStatusIcon(status.toUpperCase());
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              <span className="capitalize">{status.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Queue Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Waiting</span>
                        <span className="font-medium">{campaignSummary.queue.waiting}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active</span>
                        <span className="font-medium">{campaignSummary.queue.active}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Completed</span>
                        <span className="font-medium">{campaignSummary.queue.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Failed</span>
                        <span className="font-medium">{campaignSummary.queue.failed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Delayed</span>
                        <span className="font-medium">{campaignSummary.queue.delayed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <CampaignTable campaignId={selectedCampaignId!} />
            </>
          )}
        </TabsContent>
      </Tabs>

      {showUpload && (
        <CampaignUpload
          onClose={() => setShowUpload(false)}
          onSuccess={(campaignId) => {
            setSelectedCampaignId(campaignId);
            setShowUpload(false);
            refetchCampaigns();
          }}
        />
      )}
    </div>
  );
}