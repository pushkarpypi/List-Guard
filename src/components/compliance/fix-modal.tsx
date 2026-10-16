"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ChevronDown, Sparkles, Store, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { RuleResult, Product } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

interface FixModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: RuleResult | null;
  product: Product | null;
}

export function FixModal({ isOpen, onClose, violation, product }: FixModalProps) {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fixContent, setFixContent] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isTeaser, setIsTeaser] = useState(false);
  const [applyingToShopify, setApplyingToShopify] = useState(false);
  const [appliedToShopify, setAppliedToShopify] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && violation && product && !fixContent) {
      generateFix();
    }
    if (!isOpen) {
      // Reset state on close
      setTimeout(() => {
        setFixContent(null);
        setErrorMsg(null);
        setCopied(false);
        setIsTeaser(false);
        setLoading(false);
        setApplyingToShopify(false);
        setAppliedToShopify(false);
        setApplyError(null);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, violation, product]);

  const handleApplyToShopify = async () => {
    if (!violation || !product || !fixContent || isTeaser) return;
    setApplyingToShopify(true);
    setApplyError(null);

    try {
      const response = await fetch("/api/shopify/apply-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          ruleId: violation.ruleId,
          ruleName: violation.ruleName,
          category: violation.category,
          fixContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApplyError(data.error || "Failed to update Shopify product listing.");
        toast.error(data.error || "Failed to update Shopify product listing.");
      } else {
        setAppliedToShopify(true);
        toast.success("Listing updated successfully on Shopify with compliance notice!");
      }
    } catch {
      setApplyError("Network error. Could not connect to update service.");
      toast.error("Network error while updating Shopify.");
    } finally {
      setApplyingToShopify(false);
    }
  };

  const generateFix = async () => {
    if (!violation || !product) return;
    setLoading(true);
    setErrorMsg(null);
    setIsTeaser(false);

    try {
      const response = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violation, product, language: locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402 && data.teaser) {
          setIsTeaser(true);
          setFixContent(data.message);
        } else {
          setErrorMsg(data.error || "Failed to generate fix");
        }
      } else {
        setFixContent(data.content);
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!fixContent || isTeaser) return;
    navigator.clipboard.writeText(fixContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl glass-strong border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl">AI Fix Generator</DialogTitle>
          </div>
          {violation && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Issue:</h4>
              <p className="text-sm text-muted-foreground">{violation.message}</p>
            </div>
          )}
        </DialogHeader>

        <div className="p-6 pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Analyzing regulations and drafting compliance text...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-center">
              <p className="text-sm text-destructive">{errorMsg}</p>
              <Button onClick={generateFix} variant="outline" size="sm" className="mt-4">
                Retry Generation
              </Button>
            </div>
          ) : fixContent ? (
            <div className="space-y-4">
              <div className="relative">
                {isTeaser && (
                  <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/50 flex flex-col items-center justify-center rounded-xl border border-border">
                    <Crown className="w-8 h-8 text-amber-500 mb-2" />
                    <h3 className="font-semibold text-lg">Pro Feature</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center px-4">
                      {fixContent}
                    </p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <a href="/app/settings">Upgrade to Pro</a>
                    </Button>
                  </div>
                )}
                <div className={`p-4 bg-muted/50 rounded-xl border border-border ${isTeaser ? 'opacity-30 select-none blur-sm' : ''}`}>
                  <ScrollArea className="h-[200px] w-full">
                    <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
                      {isTeaser ? "Generating comprehensive compliance snippet for GDPR Article 13...\n\n[PRO TEXT HIDDEN]\n..." : fixContent}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              {applyError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              {appliedToShopify && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-500 text-xs">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Product listing successfully updated on Shopify with verified compliance notice.</span>
                </div>
              )}

              {!isTeaser && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Text
                      </>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      Close
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyToShopify}
                      disabled={applyingToShopify || appliedToShopify}
                      className="bg-[#95BF47] text-white hover:bg-[#85ab3f] font-semibold shadow-sm"
                    >
                      {applyingToShopify ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Updating Shopify...
                        </>
                      ) : appliedToShopify ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Applied to Shopify!
                        </>
                      ) : (
                        <>
                          <Store className="w-4 h-4 mr-2" />
                          Apply to Shopify (1-Click)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Crown(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.518l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}
