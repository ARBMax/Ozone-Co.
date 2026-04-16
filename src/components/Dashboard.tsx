import React, { useState, useRef, useCallback, useEffect } from "react";
import { analyzeData, analyzeWebsite } from "../services/geminiService";
import { AnalysisReport } from "../types";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { ReportView } from "./ReportView";
import { DataVisualizer } from "./DataVisualizer";
import { ExportCenter } from "./ExportCenter";
import { ChatBot } from "./ChatBot";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { OzoneLogo } from "./OzoneLogo";
import { Badge } from "./ui/badge";
import { CheckCircle2, Database, Download, FileText, Globe, Loader2, Play, ShieldCheck, Terminal, Upload, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";

function RawDataInput({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [localValue, setLocalValue] = useState(value);

  // Sync prop changes (e.g. from file upload or sample data) to local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the notification to parent component to avoid full DOM re-renders on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder="Paste JSON, CSV, or raw logs here for neural processing..."
      className="min-h-[350px] w-full resize-none bg-transparent p-6 font-mono text-xs focus:outline-none placeholder:opacity-20 leading-relaxed"
    />
  );
}

function WebDataInput({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  return (
    <input
      type="url"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder="https://intelligence-target.com"
      className="w-full h-14 pl-12 pr-4 rounded-xl border border-foreground/10 bg-foreground/[0.02] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
    />
  );
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [rawData, setRawData] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("report");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const websiteUrlRef = useRef(websiteUrl);
  useEffect(() => {
    websiteUrlRef.current = websiteUrl;
  }, [websiteUrl]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawData(content);
      setNotification(`File "${file.name}" attached successfully.`);
      setTimeout(() => setNotification(null), 3000);
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };
    reader.readAsText(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!rawData.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeData(rawData);
      setReport(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed. Please check your data format and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [rawData]);

  const handleAnalyzeWebsite = useCallback(async (isBackground = false) => {
    const url = websiteUrlRef.current;
    if (!url.trim()) return;
    if (!isBackground) setIsAnalyzing(true);
    setError(null);
    try {
      const scrapeRes = await axios.post("/api/scrape", { url: url });
      const result = await analyzeWebsite(scrapeRes.data);
      setReport(result);
      setLastScanTime(new Date());
    } catch (err: any) {
      console.error(err);
      if (!isBackground) {
        const errorMessage = err.response?.data?.error || err.message || "Website analysis failed. Ensure the URL is valid and public.";
        setError(errorMessage);
        setIsMonitoring(false); // Stop monitoring on error to prevent infinite error loops
      }
    } finally {
      if (!isBackground) setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      // Monitor every 60 seconds (1 min) for the prototype
      interval = setInterval(() => {
        handleAnalyzeWebsite(true);
      }, 60000); 
    }
    return () => clearInterval(interval);
  }, [isMonitoring, handleAnalyzeWebsite]);

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      handleAnalyzeWebsite(false); // Run immediately
    } else {
      setIsMonitoring(false);
    }
  };

  const [notification, setNotification] = useState<string | null>(null);

  const handleFileRequest = useCallback((type: string) => {
    if (!report) return;
    const timestamp = new Date().toLocaleTimeString();
    setNotification(`Generation Protocol Initiated: ${type.toUpperCase()}. Check chat for code.`);
    setTimeout(() => setNotification(null), 5000);
    console.log(`[${timestamp}] Requesting ${type.toUpperCase()} generation protocol...`);
  }, [report]);

  const loadSampleData = useCallback(() => {
    const sample = [
      { timestamp: "2024-03-20T08:00:00Z", cpu_usage: 45, memory_usage: 62, requests_per_sec: 120, latency_ms: 45 },
      { timestamp: "2024-03-20T09:00:00Z", cpu_usage: 52, memory_usage: 64, requests_per_sec: 145, latency_ms: 52 },
      { timestamp: "2024-03-20T10:00:00Z", cpu_usage: 48, memory_usage: 63, requests_per_sec: 130, latency_ms: 48 },
      { timestamp: "2024-03-20T11:00:00Z", cpu_usage: 89, memory_usage: 85, requests_per_sec: 450, latency_ms: 210 },
      { timestamp: "2024-03-20T12:00:00Z", cpu_usage: 92, memory_usage: 88, requests_per_sec: 480, latency_ms: 245 },
      { timestamp: "2024-03-20T13:00:00Z", cpu_usage: 95, memory_usage: 91, requests_per_sec: 510, latency_ms: 280 },
      { timestamp: "2024-03-20T14:00:00Z", cpu_usage: 55, memory_usage: 68, requests_per_sec: 160, latency_ms: 55 },
      { timestamp: "2024-03-20T15:00:00Z", cpu_usage: 50, memory_usage: 66, requests_per_sec: 140, latency_ms: 50 },
    ];
    setRawData(JSON.stringify(sample, null, 2));
  }, []);

  const exportReport = useCallback(() => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "intelligence_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [report]);

  return (
    <div className="min-h-screen bg-background technical-grid flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-foreground/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <OzoneLogo size={40} />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tighter uppercase leading-none">
                Ozone <span className="text-primary">Co.</span>
              </h1>
              <p className="text-[9px] font-mono opacity-40 uppercase tracking-[0.3em] mt-1.5">Autonomous Digital Analyst v1.0.4</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-foreground/5 border border-foreground/5">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-tight">{user?.displayName}</p>
                <p className="text-[8px] opacity-40 uppercase tracking-widest">{user?.email}</p>
              </div>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-7 w-7 rounded-full border border-foreground/10" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              >
                Logout
              </Button>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-foreground/10">
              <div className="h-2 w-2 animate-pulse rounded-full bg-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">System Optimal</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl px-6 py-12 w-full">
        <div className="space-y-16 w-full">
          {/* Input Section */}
          <section className="space-y-8 w-full max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.4em] opacity-30">Intelligence Input Protocol</h2>
            </div>
            
            <Tabs defaultValue="raw" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-foreground/5 p-1 rounded-xl mb-8">
                <TabsTrigger value="raw" className="text-[10px] uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Raw Data Stream</TabsTrigger>
                <TabsTrigger value="web" className="text-[10px] uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Web Intelligence</TabsTrigger>
              </TabsList>
              
              <TabsContent value="raw" className="mt-0">
                <Card className="border-foreground/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                  <CardHeader className="border-b border-foreground/5 bg-foreground/[0.02] py-4">
                    <CardTitle className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] opacity-40">
                      <Database className="h-3 w-3 text-primary" />
                      Data Ingestion Core
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <RawDataInput value={rawData} onChange={setRawData} />
                    <div className="flex items-center justify-between p-4 bg-foreground/[0.02] border-t border-foreground/5">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".json,.csv,.txt,.log"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-9 px-4 text-[10px] uppercase tracking-widest border-foreground/10 hover:bg-foreground/5"
                        >
                          <Upload className="mr-2 h-3 w-3" />
                          Attach
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSampleData}
                          className="h-9 px-4 text-[10px] uppercase tracking-widest border-foreground/10 hover:bg-foreground/5"
                        >
                          <Database className="mr-2 h-3 w-3" />
                          Sample
                        </Button>
                      </div>
                      <Button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing || !rawData.trim()}
                        className="h-9 px-8 bg-foreground text-background hover:opacity-90 transition-all text-[10px] uppercase tracking-[0.2em] font-bold rounded-lg"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="mr-2 h-3 w-3" />
                            Execute Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="web" className="mt-0">
                <Card className="border-foreground/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                  <CardHeader className="border-b border-foreground/5 bg-foreground/[0.02] py-4">
                    <CardTitle className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] opacity-40">
                      <Globe className="h-3 w-3 text-primary" />
                      Web Intelligence Probe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-bold ml-1">Target Domain URL</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20" />
                        <WebDataInput value={websiteUrl} onChange={setWebsiteUrl} />
                      </div>
                    </div>
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-6 text-[11px] leading-relaxed opacity-70 flex gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold uppercase tracking-widest text-primary">
                          {isMonitoring ? "24/7 Monitoring Active" : "Scraping Protocol Ready"}
                        </p>
                        <p>{isMonitoring ? "Ozone Co. is actively monitoring this domain and autonomously refreshing intelligence continuously." : "Ozone Co. will fetch the public content of the target URL, extract semantic structure, and perform a competitive intelligence audit via neural synthesis."}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => handleAnalyzeWebsite(false)} 
                        disabled={isAnalyzing || !websiteUrl.trim() || isMonitoring}
                        className="flex-1 h-14 bg-foreground text-background hover:opacity-90 transition-all text-[11px] uppercase tracking-[0.3em] font-bold rounded-xl"
                      >
                        {isAnalyzing && !isMonitoring ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Globe className="mr-3 h-4 w-4" />
                            Initialize Manual Audit
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={toggleMonitoring}
                        disabled={!websiteUrl.trim() && !isMonitoring}
                        variant={isMonitoring ? "destructive" : "default"}
                        className={`flex-1 h-14 transition-all text-[11px] uppercase tracking-[0.3em] font-bold rounded-xl border ${isMonitoring ? 'bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30' : 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'}`}
                      >
                        {isMonitoring ? (
                          <>
                            <ShieldCheck className="mr-3 h-4 w-4 animate-pulse" />
                            Stop Monitoring
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-3 h-4 w-4" />
                            Start 24/7 Monitoring
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center text-[10px] font-bold uppercase tracking-widest text-red-500"
              >
                {error}
              </motion.div>
            )}

            <Card className="border-foreground/5 bg-black text-[#E4E3E0] shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] py-3">
                <CardTitle className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] opacity-40">
                  <Terminal className="h-3 w-3" />
                  Neural System Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[120px] font-mono text-[10px] p-4 opacity-60">
                  <div className="space-y-1.5">
                    <div className="flex gap-3">
                      <span className="opacity-30">[07:41:22]</span>
                      <span>Initializing neural pathways...</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="opacity-30">[07:41:23]</span>
                      <span>Connecting to Gemini-3.1-Pro...</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="opacity-30">[07:41:24]</span>
                      <span>Awaiting data stream...</span>
                    </div>
                    {isAnalyzing && (
                      <div className="flex gap-3 text-primary animate-pulse">
                        <span className="opacity-30">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                        <span>Analyzing data patterns and synthesizing...</span>
                      </div>
                    )}
                    {report && (
                      <div className="flex gap-3 text-neon-magenta">
                        <span className="opacity-30">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                        <span>Intelligence report synthesized successfully.</span>
                      </div>
                    )}
                    {isMonitoring && (
                      <div className="flex gap-3 text-red-500 animate-pulse">
                        <span className="opacity-30">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                        <span>24/7 Background protocol active. Awaiting cycle timeout...</span>
                      </div>
                    )}
                    {lastScanTime && (
                      <div className="flex gap-3 text-neon-cyan">
                        <span className="opacity-30">[{lastScanTime.toLocaleTimeString('en-US', { hour12: false })}]</span>
                        <span>Latest recurring data refresh completed.</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>

          {/* Main Content Section */}
          <section className="space-y-12 w-full">
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-md mx-auto rounded-full bg-emerald-500/5 border border-emerald-500/10 px-6 py-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-3 w-3" />
                    {notification}
                  </div>
                  <button onClick={() => setNotification(null)} className="opacity-40 hover:opacity-100 ml-4">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!report && !isAnalyzing ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-[500px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-foreground/5 bg-foreground/[0.01]"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-foreground/5 border border-foreground/5">
                    <FileText className="h-8 w-8 opacity-10" />
                  </div>
                  <h3 className="text-xl font-bold opacity-30 uppercase tracking-widest">Awaiting Intelligence Feed</h3>
                  <p className="max-w-xs text-center text-[11px] opacity-20 uppercase tracking-widest mt-4 leading-relaxed">
                    Input raw data or a target URL to generate a decision-ready intelligence report.
                  </p>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-[500px] flex-col items-center justify-center"
                >
                  <div className="relative mb-8">
                    <Loader2 className="h-16 w-16 animate-spin opacity-10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold opacity-30 uppercase tracking-widest">Synthesizing Intelligence</h3>
                  <p className="animate-pulse font-mono text-[10px] opacity-20 uppercase tracking-[0.5em] mt-4">PROBING DATA STRUCTURES...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
                    <div className="flex flex-col items-center gap-8 mb-12 w-full">
                      <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-foreground/5 p-1 rounded-2xl">
                        <TabsTrigger value="report" className="text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md py-3">
                          Intelligence Report
                        </TabsTrigger>
                        <TabsTrigger value="visuals" className="text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md py-3">
                          Data Visualizations
                        </TabsTrigger>
                        <TabsTrigger value="export" className="text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md py-3">
                          Export Center
                        </TabsTrigger>
                      </TabsList>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={exportReport}
                        className="text-[9px] uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Raw JSON Export Protocol
                      </Button>
                    </div>

                    <div className="w-full">
                      <TabsContent value="report" className="mt-0 outline-none w-full">
                        {activeTab === "report" && <ReportView report={report} />}
                      </TabsContent>
                      <TabsContent value="visuals" className="mt-0 outline-none w-full">
                        {activeTab === "visuals" && <DataVisualizer report={report} rawData={rawData} />}
                      </TabsContent>
                      <TabsContent value="export" className="mt-0 outline-none w-full">
                        {activeTab === "export" && <ExportCenter report={report} />}
                      </TabsContent>
                    </div>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-5xl w-full border-t border-foreground/5 py-12 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em]">
            Powered by Gemini 3.1 Pro &bull; Ozone Co. &bull; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6 text-[9px] uppercase tracking-widest font-bold">
            <span>Privacy Protocol</span>
            <span>Terms of Synthesis</span>
            <span>Security Audit</span>
          </div>
        </div>
      </footer>
      <ChatBot report={report} />
    </div>
  );
}
