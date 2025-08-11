import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  pacingMaxConcurrent: z.number().min(1).max(10).optional(),
  interCallMs: z.number().min(0).max(10000).optional(),
  timezone: z.string().optional(),
});

type CampaignForm = z.infer<typeof campaignSchema>;

interface CampaignUploadProps {
  onClose: () => void;
  onSuccess: (campaignId: string) => void;
}

interface UploadResult {
  campaignId: string;
  totalImported: number;
  totalRows: number;
  errors: string[];
  suppressedCount: number;
}

export function CampaignUpload({ onClose, onSuccess }: CampaignUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      pacingMaxConcurrent: 2,
      interCallMs: 1500,
      timezone: 'Asia/Dubai',
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: CampaignForm & { file: File }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('name', data.name);
      formData.append('pacingMaxConcurrent', data.pacingMaxConcurrent?.toString() || '2');
      formData.append('interCallMs', data.interCallMs?.toString() || '1500');
      formData.append('timezone', data.timezone || 'Asia/Dubai');

      const response = await fetch('/api/campaigns/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json() as Promise<UploadResult>;
    },
    onSuccess: (result) => {
      setUploadResult(result);
      toast({
        title: 'Campaign Created',
        description: `Successfully imported ${result.totalImported} leads`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f => 
      f.type.includes('csv') || 
      f.type.includes('excel') || 
      f.type.includes('spreadsheetml') ||
      f.name.endsWith('.csv') ||
      f.name.endsWith('.xlsx')
    );
    
    if (validFile) {
      setFile(validFile);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV or Excel file',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const onSubmit = (data: CampaignForm) => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV or Excel file to upload',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate({ ...data, file });
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.csv')) return '📊';
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return '📈';
    return '📄';
  };

  if (uploadResult) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Campaign Created Successfully
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResult.totalImported}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Leads imported successfully
                  </div>
                </div>
              </CardContent>
            </Card>

            {uploadResult.totalRows !== uploadResult.totalImported && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total rows:</span> {uploadResult.totalRows}
                </div>
                <div>
                  <span className="font-medium">Imported:</span> {uploadResult.totalImported}
                </div>
                {uploadResult.suppressedCount > 0 && (
                  <div>
                    <span className="font-medium">Suppressed:</span> {uploadResult.suppressedCount}
                  </div>
                )}
              </div>
            )}

            {uploadResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Import Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-32 overflow-y-auto">
                  <div className="text-xs space-y-1">
                    {uploadResult.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-muted-foreground">
                        {error}
                      </div>
                    ))}
                    {uploadResult.errors.length > 5 && (
                      <div className="text-muted-foreground font-medium">
                        +{uploadResult.errors.length - 5} more warnings...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => onSuccess(uploadResult.campaignId)}>
              Go to Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with your leads to create a new auto-dial campaign.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pacingMaxConcurrent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Concurrent Calls</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interCallMs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inter-call Delay (ms)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="10000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1500)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="Asia/Dubai" {...field} />
                  </FormControl>
                  <FormDescription>
                    Used for business hours calculation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <div className="text-2xl">{getFileIcon(file.name)}</div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div className="font-medium">
                      Drop your CSV or Excel file here
                    </div>
                    <div className="text-sm text-muted-foreground">
                      or click to browse
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Max 15MB
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!file || uploadMutation.isPending}
              >
                {uploadMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2" />
                )}
                Create Campaign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}