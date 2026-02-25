import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import FolderPicker from '@/components/FolderPicker';
import AgentInterface from '@/components/AgentInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { LogIn, Cloud, ShieldCheck, LogOut, FolderTree, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function App() {
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('isConnected') === 'true';
  });
  const [folderSelected, setFolderSelected] = useState<string | null>(() => {
    return localStorage.getItem('lastFolderId');
  });
  const [isIngesting, setIsIngesting] = useState(false);

  const hasExchanged = useRef(false);

  // Initial check with backend to sync state
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { isConnected: backendStatus } = await apiService.checkAuthStatus();
        setIsConnected(backendStatus);
        localStorage.setItem('isConnected', String(backendStatus));
        
        if (!backendStatus) {
          setFolderSelected(null);
          localStorage.removeItem('lastFolderId');
        }
      } catch (error) {
        console.error('Failed to sync auth status', error);
      }
    };
    checkStatus();
  }, []);

  // Check if we just came back from OAuth
  useEffect(() => {
    const exchangeCode = async (code: string) => {
      if (hasExchanged.current) return;
      hasExchanged.current = true;
      
      try {
        await apiService.confirmAuth(code);
        setIsConnected(true);
        localStorage.setItem('isConnected', 'true');
        toast.success('Successfully connected to Google Drive!');
      } catch (error) {
        console.error('Failed to exchange code', error);
        toast.error('Failed to authenticate with Google Drive');
        hasExchanged.current = false;
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      exchangeCode(code);
    }
  }, []);

  const handleSetFolder = (id: string | null) => {
    setFolderSelected(id);
    if (id) {
      localStorage.setItem('lastFolderId', id);
    } else {
      localStorage.removeItem('lastFolderId');
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiService.disconnect();
      setIsConnected(false);
      setFolderSelected(null);
      localStorage.removeItem('isConnected');
      localStorage.removeItem('lastFolderId');
      toast.success('Disconnected from Google Drive');
    } catch (error) {
      console.error('Failed to disconnect', error);
      toast.error('Failed to disconnect');
    }
  };

  const handleConnect = async () => {
    try {
      const url = await apiService.getAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth URL', error);
      toast.error('Failed to initiate Google Authentication');
    }
  };

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-700">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                Unlock your knowledge.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                This platform uses AI to index your Google Drive folders and answer complex questions with citations.
              </p>
            </div>
            
            <Card className="w-full max-w-md border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Secure Connection
                </CardTitle>
                <CardDescription>
                  We need permission to access your Google Drive folders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  size="lg" 
                  className="w-full gap-2 text-lg h-14" 
                  onClick={handleConnect}
                >
                  <LogIn className="w-5 h-5" />
                  Connect Google Drive
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-10">
              {[
                { icon: <Cloud className="w-5 h-5" />, title: "Cloud Native", desc: "Indexes directly from Google Drive" },
                { icon: <ShieldCheck className="w-5 h-5" />, title: "Secure", desc: "Your data stays in your control" },
                { icon: <LogIn className="w-5 h-5" />, title: "Contextual", desc: "Understands your specific content" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center p-4 space-y-2">
                  <div className="p-3 bg-secondary rounded-full text-primary">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {!folderSelected ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                  <div className="text-left space-y-2">
                    <h2 className="text-3xl font-bold">Pick a Folder</h2>
                    <p className="text-muted-foreground">
                      Select the folder you want the agent to use.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2 text-destructive hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </Button>
                </div>
                <FolderPicker 
                  onFolderSelected={handleSetFolder} 
                  onIngestStateChange={setIsIngesting}
                />
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                  <div className="flex items-center gap-6">
                    <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium flex items-center gap-2 border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Live Agent
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">Active Knowledge Base</span>
                    </div>
                    {isIngesting ? (
                      <div className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-blue-500/20">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Indexing Files...
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-green-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Vector Synced
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => handleSetFolder(null)}>
                      Switch Folder
                    </Button>
                    <div className="w-px h-4 bg-border" />
                    <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-muted-foreground hover:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
                <AgentInterface />
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
