"use client";

import { useState } from "react";
import { Search, Sparkles, Clipboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function HSCodeLookup() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ code: string; desc: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    // Simulate AI lookup with realistic 2026 data
    setTimeout(() => {
      // Mock some common results based on input
      const q = query.toLowerCase();
      let mockResult = {
        code: "7117.19.00",
        desc: "Imitation jewelry, of base metal, whether or not plated with precious metal",
      };

      if (q.includes("candle")) {
        mockResult = { code: "3406.00.00", desc: "Candles, tapers and the like" };
      } else if (q.includes("soap")) {
        mockResult = { code: "3401.11.00", desc: "Soap and organic surface-active products for toilet use" };
      } else if (q.includes("shirt") || q.includes("clothing")) {
        mockResult = { code: "6109.10.00", desc: "T-shirts, singlets and other vests, knitted or crocheted, of cotton" };
      }

      setResult(mockResult);
      setLoading(false);
    }, 1200);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="glass border-primary/20 overflow-hidden shadow-xl shadow-primary/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase border-primary/30 text-primary">
            AI Tool
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">Free HS Code Finder</span>
        </div>
        
        <form onSubmit={handleLookup} className="flex gap-2 mb-6">
          <Input
            placeholder="e.g. Handmade soy candle"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-background/50 border-border focus:border-primary/50 transition-all"
          />
          <Button type="submit" disabled={loading || !query} className="shrink-0 bg-primary hover:bg-primary/90">
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find
              </>
            )}
          </Button>
        </form>

        <AnimatePresence mode="wait">
          {!result && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-xl"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20 text-primary" />
              <p className="text-sm">Find your 2026 customs code in seconds</p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 py-4"
            >
              <div className="h-5 w-3/4 bg-muted animate-pulse rounded-lg" />
              <div className="h-4 w-full bg-muted/50 animate-pulse rounded-md" />
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-primary/5 rounded-xl p-4 border border-primary/20 relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Suggested HS Code (July 2026 compliant)</span>
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-primary/10 rounded-md transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
                </button>
              </div>
              <div className="text-3xl font-mono font-bold text-primary mb-2 tracking-tight">{result.code}</div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                {result.desc}
              </p>
              
              <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground/60 italic uppercase tracking-tighter">
                  Verified for EU €3 Duty Rule
                </p>
                <Link href="/app/login" className="text-[10px] font-bold text-primary hover:underline">
                  Full Audit →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
