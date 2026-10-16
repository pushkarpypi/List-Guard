"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History as HistoryIcon, ArrowRight, Trash2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { getLocalScanHistory, deleteLocalScan } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ScanSummary } from "@/lib/types";

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    const scans = await getLocalScanHistory();
    setHistory(scans);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this scan result?")) return;
    await deleteLocalScan(id);
    await loadHistory();
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
        <p className="text-muted-foreground">View past compliance audits (Last 30 days)</p>
      </div>

      {history.length === 0 ? (
        <Card className="glass-strong border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <HistoryIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No history available</CardTitle>
          <CardDescription className="max-w-md mx-auto mb-6">
            Scan results are saved locally and securely. They automatically expire after 30 days.
          </CardDescription>
          <Link href="/app/scan">
            <Button>Run a Scan Now</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {history.map((scan) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  {/* Left Side (Score & Date) */}
                  <div className="p-6 sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border flex flex-col items-center justify-center bg-muted/5">
                    <div className="text-center mb-2">
                       <span className={`text-5xl font-bold tracking-tighter ${
                         scan.complianceScore >= 80 ? 'text-emerald-500' :
                         scan.complianceScore >= 50 ? 'text-amber-500' : 'text-destructive'
                       }`}>
                         {scan.complianceScore}
                       </span>
                       <span className="text-muted-foreground font-medium">/100</span>
                    </div>
                    <Badge variant="outline" className="mb-2">
                      {scan.totalProducts} Products
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(scan.createdAt)}
                    </p>
                  </div>
                  
                  {/* Right Side (Details & Actions) */}
                  <div className="p-6 sm:w-2/3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        {scan.issuesFound === 0 ? (
                           <><ShieldAlert className="w-4 h-4 text-emerald-500" /> Perfect Compliance</>
                        ) : (
                           <><ShieldAlert className="w-4 h-4 text-amber-500" /> Issues Found</>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {scan.criticalCount > 0 && (
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">
                            {scan.criticalCount} Critical
                          </Badge>
                        )}
                        {scan.warningCount > 0 && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-0">
                            {scan.warningCount} Warnings
                          </Badge>
                        )}
                        {scan.infoCount > 0 && (
                          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-0">
                            {scan.infoCount} Info
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scan.regions.map(r => (
                          <span key={r} className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-4 sm:mt-0">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(scan.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Link href="/app/dashboard">
                        <Button size="sm" variant="outline">
                          View Details <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
