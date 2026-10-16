"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  CheckCircle2, 
  Shield, 
  AlertCircle, 
  FileSpreadsheet, 
  Store, 
  ExternalLink,
  FileText,
  Camera,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { parseCSVToProducts } from "@/lib/csv-parser";
import { saveScanSummaryLocally, getMerchantProfileLocally } from "@/lib/storage";
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
import type { Region, StoreConfig, Product, ResponsiblePerson } from "@/lib/types";

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
  const [storedRP, setStoredRP] = useState<ResponsiblePerson | undefined>(undefined);
  
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("Analyzing compliance...");
  const [error, setError] = useState<string | null>(null);
  
  // OCR Ingestion States
  const [ocrResult, setOcrResult] = useState<{
    fileName: string;
    documentType: string;
    confidence: string;
    rawTranscription: string;
    products: Product[];
  } | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load merchant profile from encrypted client storage
    getMerchantProfileLocally().then((prof) => {
      if (prof?.responsiblePerson) {
        setStoredRP(prof.responsiblePerson);
      }
    });
  }, []);

  const toggleRegion = (region: Region) => {
    const newRegions = new Set(selectedRegions);
    if (newRegions.has(region)) newRegions.delete(region);
    else newRegions.add(region);
    setSelectedRegions(newRegions);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingStage("Parsing CSV catalog data...");
    setError(null);
    setOcrResult(null);

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

  const handleDocumentOrPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingStage(`AI Vision OCR reading ${file.name} (handwritten notes, packaging & labels)...`);
    setError(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to extract text from document");
      }

      if (!data.products || data.products.length === 0) {
        throw new Error("No product details could be recognized in the document. Please try a clearer photo or PDF.");
      }

      // Display the OCR confirmation preview card
      setOcrResult({
        fileName: data.fileName,
        documentType: data.documentType,
        confidence: data.confidence,
        rawTranscription: data.rawTranscription,
        products: data.products,
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to parse document or photo");
      setLoading(false);
    }
  };

  const handleProceedWithOcrProducts = async () => {
    if (!ocrResult || ocrResult.products.length === 0) return;
    await runScan(ocrResult.products, "csv");
  };

  const runScan = async (products: Product[], platform: "shopify" | "csv") => {
    setLoading(true);
    setLoadingStage(`Running 13+ compliance rules against ${products.length} products...`);
    setError(null);

    const config: StoreConfig = {
      platform,
      regions: Array.from(selectedRegions),
      hasPrivacyPolicy: hasPrivacy,
      hasCookieConsent: hasCookie,
      responsiblePerson: storedRP,
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
    } catch (err: any) {
      setError(err.message || "Failed to complete scan");
      setLoading(false);
    }
  };

  const handleShopifyScan = async () => {
    setLoading(true);
    setLoadingStage("Pulling catalog from Shopify Admin API...");
    setError(null);

    try {
      const res = await fetch("/api/shopify/products");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || data.error?.includes("connect")) {
          router.push("/app/connect?redirect=scan");
          return;
        }
        throw new Error(data.error || "Failed to fetch Shopify products");
      }
      
      if (!data.products || data.products.length === 0) {
        throw new Error("No active products found in your Shopify store.");
      }

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
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* OCR Preview Card when a Document/Photo is parsed */}
      {ocrResult && (
        <Card className="border-primary/40 bg-primary/5 shadow-md animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">AI Multimodal OCR Extraction Succeeded</CardTitle>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 uppercase text-[10px]">
                {ocrResult.confidence} Confidence • {ocrResult.documentType.replace("_", " ")}
              </Badge>
            </div>
            <CardDescription>
              Parsed from <span className="font-mono text-foreground">{ocrResult.fileName}</span> — {ocrResult.products.length} distinct item(s) recognized.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {ocrResult.products.map((p, idx) => (
                <div key={p.id} className="p-3 rounded-lg border border-border bg-background/80 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-sm">
                    <span>{idx + 1}. {p.title}</span>
                    <span className="text-primary font-mono">{p.price} {p.currency}</span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{p.description}</p>
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.tags.map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {ocrResult.rawTranscription && (
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTranscription(!showTranscription)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showTranscription ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showTranscription ? "Hide Verbatim Transcription" : "Inspect Raw OCR Extracted Text"}
                </button>
                {showTranscription && (
                  <pre className="mt-2 p-3 bg-muted/30 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border border-border text-foreground">
                    {ocrResult.rawTranscription}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleProceedWithOcrProducts} className="bg-primary hover:bg-primary/90 flex-1">
                <Shield className="w-4 h-4 mr-2" />
                Proceed to Compliance Audit ({ocrResult.products.length} Items)
              </Button>
              <Button variant="ghost" onClick={() => setOcrResult(null)} className="text-xs">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
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

              {storedRP && (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-emerald-500">Registered EU Responsible Person Active</span>
                    <p className="text-muted-foreground">{storedRP.name} ({storedRP.email})</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                    GPSR Configured
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-border h-full">
            <CardHeader>
              <CardTitle className="text-lg">3. Execute Scan</CardTitle>
              <CardDescription>Choose how to import your catalog, spec sheets, or notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Option A: Live Shopify Sync */}
              <div 
                className={`relative overflow-hidden rounded-xl border-2 ${loading ? 'border-muted opacity-50 cursor-not-allowed' : 'border-primary cursor-pointer hover:bg-primary/5'} transition-all`}
                onClick={() => !loading && handleShopifyScan()}
              >
                <div className="absolute top-0 right-0 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground rounded-bl-lg">
                  Direct API
                </div>
                <div className="p-5 text-center">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                     <Store className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Scan Live Shopify Store</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Pull products directly via Shopify Admin REST & webhooks.
                  </p>
                  <Button className="w-full relative pointer-events-none text-xs h-8" disabled={loading}>
                     {loading ? "Scanning..." : "Connect & Scan"}
                  </Button>
                </div>
              </div>

              <div className="relative flex justify-center text-xs uppercase my-2">
                <span className="bg-card px-2 text-muted-foreground text-[10px] tracking-wider font-semibold">Or file & vision import</span>
                <div className="absolute inset-y-0 left-0 w-full flex items-center -z-10">
                  <div className="w-full border-t border-border"></div>
                </div>
              </div>

              {/* Hidden Inputs */}
              <input
                type="file"
                accept=".csv"
                ref={csvInputRef}
                onChange={handleCSVUpload}
                className="hidden"
              />
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                ref={docInputRef}
                onChange={handleDocumentOrPhotoUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-3">
                {/* Option B: CSV Upload */}
                <div 
                  className={`rounded-xl border border-dashed border-border p-4 text-center transition-all ${loading ? 'opacity-50' : 'hover:border-primary/50 hover:bg-muted/30 cursor-pointer'}`}
                  onClick={() => !loading && csvInputRef.current?.click()}
                >
                  <FileSpreadsheet className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium text-xs mb-1">CSV Spreadsheet</h3>
                  <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
                    Etsy CSV backups & Shopify catalog exports
                  </p>
                  <Button variant="outline" size="sm" className="w-full text-xs h-7 pointer-events-none" disabled={loading}>
                    Browse CSV
                  </Button>
                </div>

                {/* Option C: Multimodal PDF / Photo / Handwritten Note OCR */}
                <div 
                  className={`rounded-xl border border-dashed border-primary/60 bg-primary/[0.02] p-4 text-center transition-all ${loading ? 'opacity-50' : 'hover:border-primary hover:bg-primary/5 cursor-pointer'}`}
                  onClick={() => !loading && docInputRef.current?.click()}
                >
                  <div className="relative w-6 h-6 mx-auto mb-2 text-primary">
                    <Camera className="w-6 h-6" />
                    <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-amber-500 animate-pulse" />
                  </div>
                  <h3 className="font-semibold text-xs mb-1 text-primary">PDF / Photo / Notes</h3>
                  <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
                    Handwritten supplier specs, packaging labels & PDFs
                  </p>
                  <Button variant="outline" size="sm" className="w-full text-xs h-7 border-primary/40 text-primary pointer-events-none" disabled={loading}>
                    Upload Image/PDF
                  </Button>
                </div>
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
                    <Button onClick={() => csvInputRef.current?.click()} className="w-full">
                      I have my CSV, upload it
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
            {loadingStage}
          </p>
          <div className="w-64 h-2 bg-muted rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-progress" />
          </div>
        </div>
      )}
    </div>
  );
}
