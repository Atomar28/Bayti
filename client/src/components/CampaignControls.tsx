import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CampaignControlsProps {
  campaignId: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'DONE';
  onStatusChange: () => void;
}

export function CampaignControls({ campaignId, status, onStatusChange }: CampaignControlsProps) {
  const { toast } = useToast();

  const startMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${campaignId}/start`, {
      method: 'POST',
    }),
    onSuccess: () => {
      toast({
        title: 'Campaign Started',
        description: 'Campaign is now running and calls are being placed',
      });
      onStatusChange();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Start Campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${campaignId}/pause`, {
      method: 'POST',
    }),
    onSuccess: () => {
      toast({
        title: 'Campaign Paused',
        description: 'Campaign has been paused, current calls will complete',
      });
      onStatusChange();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Pause Campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${campaignId}/resume`, {
      method: 'POST',
    }),
    onSuccess: () => {
      toast({
        title: 'Campaign Resumed',
        description: 'Campaign is now running again',
      });
      onStatusChange();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Resume Campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${campaignId}/stop`, {
      method: 'POST',
    }),
    onSuccess: () => {
      toast({
        title: 'Campaign Stopped',
        description: 'Campaign has been stopped permanently',
      });
      onStatusChange();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Stop Campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isLoading = 
    startMutation.isPending || 
    pauseMutation.isPending || 
    resumeMutation.isPending || 
    stopMutation.isPending;

  const renderControls = () => {
    switch (status) {
      case 'DRAFT':
        return (
          <Button
            onClick={() => startMutation.mutate()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Campaign
          </Button>
        );

      case 'RUNNING':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => pauseMutation.mutate()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button
              variant="destructive"
              onClick={() => stopMutation.mutate()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>
        );

      case 'PAUSED':
        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => resumeMutation.mutate()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Resume
            </Button>
            <Button
              variant="destructive"
              onClick={() => stopMutation.mutate()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>
        );

      case 'STOPPED':
      case 'DONE':
        return (
          <div className="text-sm text-muted-foreground">
            Campaign {status.toLowerCase()}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
      )}
      {renderControls()}
    </div>
  );
}