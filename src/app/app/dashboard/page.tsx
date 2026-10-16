"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, PlusCircle, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getLocalScanHistory } from "@/lib/storage";
import { ScoreRing } from "@/components/compliance/score-ring";
import { ScanResultsTable } from "@/components/compliance/scan-results-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { StorefrontWidgetModal } from "@/components/compliance/storefront-widget-modal";
import type { ScanSummary } from "@/lib/types";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const scans = await getLocalScanHistory();
      setHistory(scans);
      setLoading(false);
    }
    loadHistory();
  }, []);

  const latestScan = history[0] || null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dash.title")}</h1>
          <p className="text-muted-foreground">{t("dash.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <StorefrontWidgetModal />
          <Link href="/app/scan">
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="w-4 h-4 mr-2" />
              {t("dash.startScan")}
            </Button>
          </Link>
        </div>
      </div>

      {!latestScan ? (
        <Card className="glass-strong border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No scans found</CardTitle>
          <CardDescription className="max-w-md mx-auto mb-6">
            You haven't scanned any products yet. Run your first compliance check to generate a health score and get automated fixes.
          </CardDescription>
          <Link href="/app/scan">
            <Button>Start Your First Scan</Button>
          </Link>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Scarcity Bar */}
          <Card className="glass-strong border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-background to-background overflow-hidden relative group">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Limited Lifetime Access</h4>
                  <p className="text-xs text-muted-foreground">Pay once, scan forever. Save $1,000+ over 5 years.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex-1 sm:w-48">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">242/300 slots taken</span>
                    <span className="text-[10px] font-bold">81%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "81%" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      className="h-full bg-amber-500"
                    />
                  </div>
                </div>
                <Link href="/app/settings">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                    Claim Slot
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-border">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <ScoreRing score={latestScan.complianceScore} size={140} strokeWidth={12} />
                <p className="text-xs text-muted-foreground mt-4 uppercase tracking-wider font-semibold">
                  Overall Health
                </p>
              </CardContent>
            </Card>

            <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <Card className="glass border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    Products Scanned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{latestScan.totalProducts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last check: {formatDate(latestScan.createdAt)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border-border relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium flex items-center justify-between">
                    Critical Issues
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-destructive">
                    {latestScan.criticalCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires immediate attention
                  </p>
                </CardContent>
                {latestScan.criticalCount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-destructive/50" />
                )}
              </Card>

              <Card className="glass border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    Total Issues Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{latestScan.issuesFound}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                      {latestScan.warningCount} Warnings
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500">
                      {latestScan.infoCount} Info
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border bg-gradient-to-br from-primary/10 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    Regions Covered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {latestScan.regions.map(r => (
                      <span key={r} className="text-xs px-2 py-1 bg-background/50 border border-border rounded-md font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Details Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Product Breakdown
              </h3>
            </div>
            
            <ScanResultsTable 
              results={latestScan.results} 
              products={[]} // The table gracefully falls back using result.productTitle if full product data isn't passed
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
