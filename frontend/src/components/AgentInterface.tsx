import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/api';
import type { AgentSession } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Loader2, 
  BrainCircuit, 
  ListChecks, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Database,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const AgentInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(false);
  const pollInterval = useRef<number | null>(null);

  const startTask = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSessionId(null);
    setSession(null);
    
    try {
      const { sessionId } = await apiService.startAgent(query);
      setSessionId(sessionId);
      toast.success('Agent started working!');
    } catch (error) {
      console.error('Failed to start agent', error);
      toast.error('Failed to start search session');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStatus = async () => {
    if (!sessionId) return;
    try {
      const data = await apiService.getSession(sessionId);
      setSession(data);
      if (data.status === 'completed' || data.status === 'failed') {
        if (pollInterval.current) {
          window.clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
      }
    } catch (error) {
      console.error('Error polling session', error);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionStatus(); // Initial fetch
      pollInterval.current = window.setInterval(fetchSessionStatus, 2000);
    }
    return () => {
      if (pollInterval.current) window.clearInterval(pollInterval.current);
    };
  }, [sessionId]);

  const getToolIcon = (action: string) => {
    switch (action) {
      case 'web_search': return <Search className="w-4 h-4" />;
      case 'vector_search': return <Database className="w-4 h-4" />;
      case 'drive_fetch': return <FileText className="w-4 h-4" />;
      default: return <BrainCircuit className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="relative">
            <Textarea
              placeholder="Ask me anything from your documents or the web..."
              className="resize-none pr-12 min-h-[100px] text-lg bg-background/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  startTask();
                }
              }}
            />
            <Button 
              className="absolute bottom-3 right-3" 
              size="icon" 
              onClick={startTask}
              disabled={loading || !query.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex justify-end">
            Press Ctrl + Enter to send
          </p>
        </CardContent>
      </Card>

      {session && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Plan & Log */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  Strategy & Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.plan.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="mt-0.5">
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 border-2 rounded-full border-muted" />
                        )}
                      </div>
                      <span className={step.completed ? "text-muted-foreground line-through" : ""}>
                        {step.description}
                      </span>
                    </div>
                  ))}
                  {session.plan.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Developing plan...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  Execution Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {session.history.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 h-4 uppercase">
                            {item.role === 'assistant' ? 'Action' : 'Tool'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded text-xs font-mono break-all whitespace-pre-wrap">
                          {item.content}
                        </div>
                      </div>
                    ))}
                    {session.status === 'running' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Thinking...
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results & Findings */}
          <div className="md:col-span-2 space-y-6">
            {session.result ? (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Final Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{session.result}</ReactMarkdown>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  {session.status === 'running' ? (
                    <>
                      <div className="relative">
                        <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Agent is Processing</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          Synthesizing information from multiple sources to provide you with the best answer.
                        </p>
                      </div>
                    </>
                  ) : session.status === 'failed' ? (
                    <>
                      <AlertCircle className="w-12 h-12 text-destructive" />
                      <div className="space-y-2">
                        <h3 className="font-semibold text-destructive">Task Failed</h3>
                        <p className="text-sm text-muted-foreground">
                          Something went wrong during execution. Please try again.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-full">
                        <BrainCircuit className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Waiting for task start...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tool Outputs (Transparency) */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium px-1">Retrieved Context & Tools</h3>
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(session.observations || {}).map(([key, value], idx) => (
                  <AccordionItem key={idx} value={`tool-${idx}`} className="border rounded-md px-4 bg-card/30">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        {getToolIcon(key.split('_')[0])}
                        <span className="font-mono text-xs">{key}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-[10px] bg-muted/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInterface;
