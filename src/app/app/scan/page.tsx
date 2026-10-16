"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, Shield, AlertCircle, FileSpreadsheet, Store, ExternalLink } from "lucide-react";
import { parseCSVToProducts } from "@/lib/csv-parser";
import { saveScanSummaryLocally } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import type { Region, StoreConfig, Product } from "@/lib/types";

const ALL_REGIONS: { id: Region; label: string; desc: string }[] = [
  { id: "EU", label: "Europe (EU)", desc: "GDPR, GPSR, €3 Duty, PPWR" },
  { id: "US", label: "United States", desc: "Federal rules" },
  { id: "CA", label: "California", desc: "Prop 65" },
  { id: "UK", label: "United Kingdom", desc: "UK GDPR, UKCA marking" },
  { id: "IN", label: "India", desc: "BIS regulations" },
  { id: "GLOBAL", label: "Global", desc: "Prohibited items & age limits" },
];

export default function NewScanPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [selectedRegions, setSelectedRegions] = useState<Set<Region>>(new Set(["EU", "US", "CA", "GLOBAL"]));
  const [hasPrivacy, setHasPrivacy] = useState(true);
  const [hasCookie, setHasCookie] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRegion = (region: Region) => {
    const newRegions = new Set(selectedRegions);
    if (newRegions.has(region)) newRegions.delete(region);
    else newRegions.add(region);
    setSelectedRegions(newRegions);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const products = parseCSVToProducts(text);
      
      if (products.length === 0) {
        throw new Error("No valid products found in CSV. Make sure it has Title, Description, and Price columns.");
      }

      await runScan(products, "csv");
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV file");
      setLoading(false);
    }
  };

  const runScan = async (products: Product[], platform: "shopify" | "csv") => {
    setLoading(true);
    setError(null);

    const config: StoreConfig = {
      platform,
      regions: Array.from(selectedRegions),
      hasPrivacyPolicy: hasPrivacy,
      hasCookieConsent: hasCookie,
      responsiblePerson: undefined, // Could grab from DB user settings
    };

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, config }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }

      // Zero-cloud-footprint secure local storage
      await saveScanSummaryLocally(data);
      
      // Redirect to dashboard to view results
      router.push("/app/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleShopifyScan = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Shopify products
      const res = await fetch("/api/shopify/products");
      const data = await res.json();
      
      if (!res.ok) {
        // If not connected, redirect to connect page
        if (res.status === 404) {
          router.push("/app/connect");
          return;
        }
        throw new Error(data.error || "Failed to fetch Shopify products");
      }
      
      if (!data.products || data.products.length === 0) {
        throw new Error("No active products found in your Shopify store.");
      }

      // 2. Scan them
      await runScan(data.products, "shopify");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("scan.title")}</h1>
        <p className="text-muted-foreground">{t("scan.subtitle")}</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="glass border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                1. Target Regions
                <Badge variant="secondary" className="font-mono">{selectedRegions.size} Selected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_REGIONS.map((region) => {
                  const isSelected = selectedRegions.has(region.id);
                  return (
                    <div
                      key={region.id}
                      onClick={() => toggleRegion(region.id)}
                      className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{region.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{region.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">2. Global Store Checks</CardTitle>
              <CardDescription>We'll combine this with your product data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                onClick={() => setHasPrivacy(!hasPrivacy)}
              >
                <div>
                  <p className="text-sm font-medium">Privacy Policy Configured</p>
                  <p className="text-xs text-muted-foreground">Store has active privacy policy</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${hasPrivacy ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`w-4 h-4 rounded-full bg-background transition-transform ${hasPrivacy ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                onClick={() => setHasCookie(!hasCookie)}
              >
                <div>
                  <p className="text-sm font-medium">Cookie Consent Banner Active</p>
                  <p className="text-xs text-muted-foreground">Store requests cookie permission</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${hasCookie ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`w-4 h-4 rounded-full bg-background transition-transform ${hasCookie ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-border h-full">
            <CardHeader>
              <CardTitle className="text-lg">3. Execute Scan</CardTitle>
              <CardDescription>Choose how to import your products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div 
                className={`relative overflow-hidden rounded-xl border-2 ${loading ? 'border-muted opacity-50 cursor-not-allowed' : 'border-primary cursor-pointer hover:bg-primary/5'} transition-all`}
                onClick={() => !loading && handleShopifyScan()}
              >
                <div className="absolute top-0 right-0 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground rounded-bl-lg">
                  Recommended
                </div>
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Store className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Scan Live Shopify Store</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pull all active products directly API.
                  </p>
                  <Button className="w-full relative pointer-events-none" disabled={loading}>
                     {loading ? "Scanning..." : "Connect & Scan"}
                  </Button>
                </div>
              </div>

              <div className="relative flex justify-center text-xs uppercase my-4">
                <span className="bg-card px-2 text-muted-foreground text-[10px] tracking-wider font-semibold">Or manual upload</span>
                <div className="absolute inset-y-0 left-0 w-full flex items-center -z-10">
                  <div className="w-full border-t border-border"></div>
                </div>
              </div>

              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <div 
                className={`rounded-xl border border-dashed border-border p-6 text-center transition-all ${loading ? 'opacity-50' : 'hover:border-primary/50 hover:bg-muted/30 cursor-pointer'}`}
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-sm mb-1">Upload CSV Backup</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports Etsy exports and generic formats
                </p>
                <Button variant="outline" className="w-full relative pointer-events-none" disabled={loading}>
                  Browse File
                </Button>
              </div>

              <div className="mt-2 text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-[10px] font-medium text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
                      <ExternalLink className="w-2.5 h-2.5" />
                      How do I get my Etsy CSV?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong border-border max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Exporting from Etsy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-sm text-left">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                        <p>Go to <b>Shop Manager</b> on Etsy.com</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                        <p>Click <b>Settings</b> → <b>Options</b></p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                        <p>Select the <b>Download Data</b> tab</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
                        <p>Click <b>Download CSV</b> under "Currently for Sale Listings"</p>
                      </div>
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                      I have my file, upload it
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="relative">
            <Shield className="w-16 h-16 text-primary/20" />
            <Shield className="w-16 h-16 text-primary absolute inset-0 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mt-6 mb-2">Analyzing Compliance</h2>
          <p className="text-muted-foreground text-sm max-w-sm text-center">
            Gemini AI is reviewing your listings against 2026 GDPR, GPSR, and customs databases...
          </p>
          <div className="w-64 h-2 bg-muted rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-progress" />
          </div>
        </div>
      )}
    </div>
  );
}
