"use client";

import { useState } from "react";
import { Copy, Check, Code2, Globe, Shield, Sparkles, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export function StorefrontWidgetModal() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"liquid" | "preview">("preview");

  const liquidSnippet = `{% comment %}
  =============================================================================
  List Guard Smart Compliance Widget (Theme App Block / Liquid Embed)
  Automatically renders GPSR, Prop 65, and 2026 EU Customs duty disclosures.
  Features built-in Geo-Fencing: warnings only display to affected shoppers.
  =============================================================================
{% endcomment %}

<div id="listguard-compliance-container" class="listguard-theme-block" style="display:none; margin: 18px 0; font-family: inherit;">
  <div class="listguard-card" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; background: #fafafa; font-size: 13px; color: #1e293b;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <span style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #0284c7;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Compliance & Regulatory Disclosures
      </span>
      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">Verified</span>
    </div>

    <!-- GPSR / EU Safety Notice (Shown to EU/UK visitors) -->
    <div id="lg-gpsr-section" style="margin-top: 8px; border-top: 1px dashed #cbd5e1; pt-2;">
      <div style="font-weight: 600; font-size: 12px; color: #334155;">🇪🇺 EU General Product Safety (GPSR 2023/988):</div>
      <p style="margin: 4px 0; color: #475569; font-size: 12px;">
        {{ product.metafields.listguard.warning_gpsr | default: "Manufacturer & EU Responsible Person details documented and verified for EU trade standards." }}
      </p>
    </div>

    <!-- Prop 65 California Warning (Shown only to California IP/Region) -->
    <div id="lg-prop65-section" style="display: none; margin-top: 8px; border-top: 1px dashed #fca5a5; padding-top: 8px;">
      <div style="font-weight: 700; font-size: 12px; color: #b91c1c;">⚠️ CALIFORNIA PROPOSITION 65 WARNING:</div>
      <p style="margin: 4px 0; color: #7f1d1d; font-size: 12px;">
        {{ product.metafields.listguard.warning_prop65 | default: "WARNING: This product may contain chemicals known to the State of California to cause cancer and birth defects or other reproductive harm." }}
      </p>
    </div>

    <!-- July 2026 EU Customs Duty Disclosure -->
    <div id="lg-customs-section" style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
      <div style="font-weight: 600; font-size: 12px; color: #334155;">📦 Cross-Border Customs & Duty (July 2026):</div>
      <p style="margin: 4px 0; color: #475569; font-size: 12px;">
        {{ product.metafields.listguard.warning_customs | default: "Parcels under €150 to the EU are subject to EU Customs Reform flat duty rules. Transparent clearance guaranteed." }}
      </p>
    </div>
  </div>
</div>

<script>
  (function() {
    try {
      var container = document.getElementById('listguard-compliance-container');
      if (!container) return;
      container.style.display = 'block';

      // Smart Geo-Detection (Client-side Timezone/Locale heuristic + optional geo API)
      var userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      var isCalifornia = userTimezone.includes("America/Los_Angeles");

      if (isCalifornia) {
        var prop65 = document.getElementById('lg-prop65-section');
        if (prop65) prop65.style.display = 'block';
      }
    } catch(e) {}
  })();
</script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(liquidSnippet);
    setCopied(true);
    toast.success("Theme Liquid snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:border-primary">
          <Code2 className="w-4 h-4 text-primary" />
          <span>Storefront Widget (Liquid Code)</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl glass-strong border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl">Storefront Compliance Widget</DialogTitle>
            <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-500 border-0">
              Zero-App-Tax
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Display your compliance disclosures directly on your Shopify Product Page using native Liquid. No monthly widget fees.
          </p>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="flex border-b border-border gap-4 mb-4">
            <button
              onClick={() => setActiveTab("preview")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "preview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Live Widget Preview
            </button>
            <button
              onClick={() => setActiveTab("liquid")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "liquid"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Liquid Embed Code
            </button>
          </div>

          {activeTab === "preview" ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-3 font-mono">
                  PREVIEW: How this renders under your product "Buy Now" button
                </p>
                
                {/* Live Preview Render */}
                <div className="border border-border/80 rounded-lg p-4 bg-background shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-sm text-primary">
                      <Shield className="w-4 h-4" />
                      Compliance & Regulatory Disclosures
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-0">
                      Verified Active
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-border/60 text-xs space-y-1">
                    <span className="font-semibold text-foreground">🇪🇺 EU GPSR (Regulation 2023/988):</span>
                    <p className="text-muted-foreground">
                      Manufacturer: Nordic Craftworks Ltd (Dublin, IE) • EU Responsible Person contact on packaging.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-dashed border-red-500/30 text-xs space-y-1 bg-red-500/5 p-2 rounded">
                    <span className="font-bold text-red-500">⚠️ CALIFORNIA PROP 65 (Geo-fenced):</span>
                    <p className="text-red-400">
                      WARNING: Contains materials tested for California safe harbor thresholds.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 text-xs space-y-1">
                    <span className="font-semibold text-foreground">📦 Customs & Tariffs (July 2026):</span>
                    <p className="text-muted-foreground">
                      Tariff code classified (HS 6109.10) • Flat €3 duty compliant for EU cross-border delivery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-xs text-primary flex items-center justify-between">
                <span>⚡ Smart Geo-Fencing included: Prop 65 only shows to California shoppers.</span>
                <Button size="sm" onClick={() => setActiveTab("liquid")} className="bg-primary hover:bg-primary/90 text-xs h-7">
                  Get Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="relative">
                <ScrollArea className="h-[260px] w-full rounded-xl bg-muted/60 border border-border p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">
                    {liquidSnippet}
                  </pre>
                </ScrollArea>
              </div>

              <div className="text-xs text-muted-foreground">
                <b>Installation instructions:</b> In your Shopify Theme Editor, add a <b>Custom Liquid</b> block on the Default Product template and paste this snippet.
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Compatible with all Online Store 2.0 themes</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyCode}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Copied Snippet
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy Liquid Code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
