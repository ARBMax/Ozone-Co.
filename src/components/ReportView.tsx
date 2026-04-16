import React, { memo } from "react";
import { AnalysisReport } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Lightbulb, Target, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface ReportViewProps {
  report: AnalysisReport;
}

export const ReportView = memo(function ReportView({ report }: ReportViewProps) {
  return (
    <div className="space-y-8">
      {/* Hero Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-[#141414]/10 dark:border-white/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              Executive Intelligence Brief
            </CardTitle>
            <Badge variant={report.confidenceScore > 80 ? "default" : "secondary"} className="font-mono text-[10px] px-3 py-0.5 rounded-full">
              CONFIDENCE: {report.confidenceScore}%
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-serif italic leading-snug text-foreground max-w-3xl">
              "{report.executiveSummary}"
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Section */}
      {report.chartData && report.chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-[#141414]/10 dark:border-white/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-40">
                <BarChart3 className="h-3 w-3 text-primary" />
                {report.chartTitle || "Metric Analysis"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(37, 99, 235, 0.03)' }}
                      contentStyle={{ 
                        backgroundColor: '#020617', 
                        border: 'none', 
                        borderRadius: '8px',
                        fontSize: '10px',
                        color: '#E4E3E0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        style={{ fontSize: '10px', fill: 'currentColor', opacity: 0.6 }} 
                        offset={10} 
                      />
                      {report.chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-neon-cyan)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Analysis Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full border-[#141414]/10 dark:border-white/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-40">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Critical Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {report.criticalAnomalies.map((anomaly, i) => (
                  <li key={i} className="flex gap-4 group">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                      {anomaly}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="h-full border-[#141414]/10 dark:border-white/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-40">
                <Lightbulb className="h-3 w-3 text-primary" />
                Root Cause Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed opacity-80 italic border-l-2 border-primary/20 pl-4 py-1">
                {report.theWhy}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sales Review Section */}
      {report.salesReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="border-[#141414]/10 dark:border-white/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-40">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                Sales & Performance Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed opacity-80">
                {report.salesReview}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Plan Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-none bg-[#000B26] text-[#E4E3E0] shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-16 -mt-16" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] opacity-60">
              <Target className="h-3 w-3" />
              Strategic Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {report.actionPlan.map((action, i) => (
                <div key={i} className="flex items-start gap-4 rounded-xl bg-white/5 p-5 border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium leading-snug opacity-90">{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});
