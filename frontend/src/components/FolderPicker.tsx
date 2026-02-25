import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import type { DriveFolder } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderIcon, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FolderPickerProps {
  onFolderSelected: (folderId: string) => void;
  onIngestStateChange: (isIngesting: boolean) => void;
}

const FolderPicker: React.FC<FolderPickerProps> = ({ onFolderSelected, onIngestStateChange }) => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDriveFolders();
      setFolders(data);
    } catch (error: any) {
      console.error('Failed to fetch folders', error);
      const message = error.response?.data?.details || error.response?.data?.error || 'Failed to load Google Drive folders';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleSelect = async (folderId: string) => {
    setSelecting(folderId);
    onIngestStateChange(true);
    try {
      await apiService.triggerIngestion(folderId);
      toast.success('Folder data successfully processed and stored in vector database!');
      onFolderSelected(folderId);
    } catch (error) {
      console.error('Failed to trigger ingestion', error);
      toast.error('Failed to start ingestion for this folder');
    } finally {
      setSelecting(null);
      onIngestStateChange(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Scanning your Google Drive...</p>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Source Folder</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchFolders}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Choose a folder from your Google Drive to index for the search agent.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {folders.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No folders found in your Google Drive root.</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-3 rounded-md transition-all hover:bg-accent/50 border border-transparent hover:border-accent group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded group-hover:bg-primary/20 transition-colors">
                    <FolderIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">Google Drive Folder</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={selecting === folder.id ? "secondary" : "default"}
                  disabled={selecting !== null}
                  onClick={() => handleSelect(folder.id)}
                >
                  {selecting === folder.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {selecting === folder.id ? "Indexing..." : "Select"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex items-center gap-2">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
        Only selected folders will be accessed by the agent.
      </CardFooter>
    </Card>
  );
};

export default FolderPicker;
