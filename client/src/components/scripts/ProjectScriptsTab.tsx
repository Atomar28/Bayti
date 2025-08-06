import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit, Trash, Play, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectScript } from "@shared/schema";

interface ScriptFormData {
  projectId: string;
  projectName: string;
  scriptContent: string;
  description?: string;
  placeholders?: { [key: string]: string };
  agentId?: string;
}

interface ScriptCardProps {
  script: ProjectScript;
  onEdit: (script: ProjectScript) => void;
  onDelete: (id: string) => void;
  onPreview: (script: ProjectScript) => void;
}

function ScriptCard({ script, onEdit, onDelete, onPreview }: ScriptCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{script.projectName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{script.description}</p>
          </div>
          <Badge variant={script.isActive ? "default" : "secondary"}>
            {script.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm">
            <span className="font-medium">Project ID:</span> {script.projectId}
          </div>
          
          {script.placeholders && Object.keys(script.placeholders).length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Placeholders:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.keys(script.placeholders).map((key) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {`{${key}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <div className="bg-gray-50 rounded p-2 max-h-20 overflow-hidden">
              {script.scriptContent.substring(0, 150)}
              {script.scriptContent.length > 150 && "..."}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => onPreview(script)}>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(script)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(script.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScriptDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  script, 
  isEdit = false 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScriptFormData) => void;
  script?: ProjectScript;
  isEdit?: boolean;
}) {
  const [formData, setFormData] = useState<ScriptFormData>({
    projectId: script?.projectId || "",
    projectName: script?.projectName || "",
    scriptContent: script?.scriptContent || "",
    description: script?.description || "",
    placeholders: script?.placeholders || {}
  });

  const [newPlaceholder, setNewPlaceholder] = useState({ key: "", value: "" });

  const addPlaceholder = () => {
    if (newPlaceholder.key && newPlaceholder.value) {
      setFormData(prev => ({
        ...prev,
        placeholders: {
          ...prev.placeholders,
          [newPlaceholder.key]: newPlaceholder.value
        }
      }));
      setNewPlaceholder({ key: "", value: "" });
    }
  };

  const removePlaceholder = (key: string) => {
    setFormData(prev => {
      const newPlaceholders = { ...prev.placeholders };
      delete newPlaceholders[key];
      return { ...prev, placeholders: newPlaceholders };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Create"} Project Script</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                placeholder="e.g., PALM_TOWERS_01"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g., Palm Towers Dubai"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the project"
            />
          </div>
          
          <div>
            <Label htmlFor="scriptContent">Script Content</Label>
            <Textarea
              id="scriptContent"
              value={formData.scriptContent}
              onChange={(e) => setFormData(prev => ({ ...prev, scriptContent: e.target.value }))}
              placeholder="Hello {lead_name}, I'm calling about {project_name}. This premium property is available at {price}..."
              rows={8}
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Use placeholders like {`{lead_name}, {project_name}, {price}`} for dynamic content.
            </p>
          </div>
          
          <div>
            <Label>Placeholders</Label>
            <div className="space-y-2">
              {formData.placeholders && Object.entries(formData.placeholders).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm font-mono">{`{${key}}`}</span>
                  <span className="text-sm">→</span>
                  <span className="text-sm flex-1">{value}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removePlaceholder(key)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input
                  placeholder="Placeholder key (e.g., price)"
                  value={newPlaceholder.key}
                  onChange={(e) => setNewPlaceholder(prev => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="Default value (e.g., 2.5M AED)"
                  value={newPlaceholder.value}
                  onChange={(e) => setNewPlaceholder(prev => ({ ...prev, value: e.target.value }))}
                />
                <Button type="button" onClick={addPlaceholder} disabled={!newPlaceholder.key || !newPlaceholder.value}>
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update" : "Create"} Script
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ script, isOpen, onClose }: { script?: ProjectScript; isOpen: boolean; onClose: () => void }) {
  if (!script) return null;

  const processedScript = script.placeholders ? 
    Object.entries(script.placeholders).reduce((content, [key, value]) => 
      content.replace(new RegExp(`{${key}}`, 'g'), value), script.scriptContent
    ) : script.scriptContent;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Script Preview: {script.projectName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Processed Script (with placeholders filled):</h4>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm leading-relaxed">{processedScript}</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectScriptsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<ProjectScript | undefined>();
  const [previewScript, setPreviewScript] = useState<ProjectScript | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ["/api/v1/scripts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScriptFormData) => {
      return apiRequest("/api/v1/script", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/scripts"] });
      toast({
        title: "Success",
        description: "Project script created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Script creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project script",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScriptFormData> }) => {
      return apiRequest(`/api/v1/scripts/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/scripts"] });
      toast({
        title: "Success",
        description: "Project script updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project script",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/v1/scripts/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/scripts"] });
      toast({
        title: "Success",
        description: "Project script deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project script",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: ScriptFormData) => {
    // Add agentId to the data before creating
    const scriptData = {
      ...data,
      agentId: "mock-agent-id" // Default agent ID for now
    };
    createMutation.mutate(scriptData);
  };

  const handleEdit = (script: ProjectScript) => {
    setEditingScript(script);
    setDialogOpen(true);
  };

  const handleUpdate = (data: ScriptFormData) => {
    if (editingScript) {
      updateMutation.mutate({ id: editingScript.id, data });
      setEditingScript(undefined);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this script?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePreview = (script: ProjectScript) => {
    setPreviewScript(script);
    setPreviewOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingScript(undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Scripts</h2>
        
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Script
        </Button>
      </div>

      {Array.isArray(scripts) && scripts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scripts.map((script: ProjectScript) => (
            <ScriptCard
              key={script.id}
              script={script}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No project scripts created</h3>
            <p className="text-gray-600 mb-4">
              Create custom scripts for specific projects to enhance AI call conversations.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Script
            </Button>
          </CardContent>
        </Card>
      )}

      <ScriptDialog
        isOpen={dialogOpen}
        onClose={closeDialog}
        onSubmit={editingScript ? handleUpdate : handleCreate}
        script={editingScript}
        isEdit={!!editingScript}
      />

      <PreviewDialog
        script={previewScript}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}