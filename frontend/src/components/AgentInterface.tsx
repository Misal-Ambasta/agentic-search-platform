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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Plan & Log */}
          <div className="lg:col-span-1 space-y-4">
            <Accordion type="single" collapsible defaultValue="plan" className="w-full space-y-4">
              <AccordionItem value="plan" className="border rounded-lg bg-card text-card-foreground shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ListChecks className="w-4 h-4 text-primary" />
                    Strategy & Plan
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <div className="space-y-3">
                    {session.plan.map((step, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="mt-0.5 min-w-[16px]">
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
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="log" className="border rounded-lg bg-card text-card-foreground shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Terminal className="w-4 h-4 text-primary" />
                    Execution Log
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0 pt-0">
                  <ScrollArea className="h-[400px] w-full px-4 pb-4">
                    <div className="space-y-4 pt-4">
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
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Middle: Results */}
          <div className="lg:col-span-2">
            {session.result ? (
              <Card className="h-full border-green-500/20 bg-green-500/5">
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
              <Card className="h-full border-dashed min-h-[500px]">
                <CardContent className="flex flex-col items-center justify-center h-full text-center gap-4">
                  {session.status === 'running' ? (
                    <>
                      <div className="relative">
                        <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Agent is Processing</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
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
                      <div className="p-4 bg-muted rounded-full inline-block">
                        <BrainCircuit className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Waiting for task start...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Tools Context */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Retrieved Context
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 relative">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2 pt-1">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(session.observations || {}).map(([key, value], idx) => {
                        // Type guard for value
                        const observation = value as { tool?: string; output?: string };
                        const toolName = observation.tool || 'unknown';
                        const displayLabel = `context: ${key} : ${toolName}`;
                        
                        return (
                        <AccordionItem key={idx} value={`tool-${idx}`} className="border-b last:border-0">
                          <AccordionTrigger className="hover:no-underline py-2 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              {getToolIcon(toolName)}
                              <span className="font-mono truncate max-w-[200px]" title={displayLabel}>
                                {displayLabel}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <pre className="text-[10px] bg-muted/50 p-2 rounded overflow-x-auto max-h-[200px]">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                      )})}
                    </Accordion>
                    {Object.keys(session.observations || {}).length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center mt-10">
                        No context retrieved yet...
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInterface;
