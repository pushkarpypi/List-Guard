"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Wand2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FixModal } from "./fix-modal";
import type { ProductScanResult, RuleResult, Product } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface ScanResultsTableProps {
  results: ProductScanResult[];
  products: Product[];
}

export function ScanResultsTable({ results, products }: ScanResultsTableProps) {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedViolation, setSelectedViolation] = useState<{
    violation: RuleResult;
    product: Product;
  } | null>(null);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getSeverityIcon = (severity: string, passed: boolean) => {
    if (passed) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    switch (severity) {
      case "critical": return <XCircle className="w-4 h-4 text-destructive" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "info": return <Info className="w-4 h-4 text-cyan-500" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">Critical</Badge>;
      case "warning": return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-0">Warning</Badge>;
      case "info": return <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-0">Info</Badge>;
      default: return null;
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">Issues</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No scan results available.
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => {
                const isExpanded = expandedRows.has(result.productId);
                const failedViolations = result.violations.filter(v => !v.passed);
                const product = products.find(p => p.id === result.productId) || {
                  id: result.productId,
                  title: result.productTitle,
                  description: "",
                  tags: [],
                  price: 0,
                  currency: "USD",
                  images: [],
                  variants: [],
                  platform: "shopify"
                } as Product;

                return (
                  <React.Fragment key={result.productId}>
                    <TableRow 
                      className={`cursor-pointer transition-colors hover:bg-muted/30 ${isExpanded ? 'bg-muted/10' : ''}`}
                      onClick={() => toggleRow(result.productId)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.productTitle}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          result.score >= 80 ? 'text-emerald-500' :
                          result.score >= 50 ? 'text-amber-500' : 'text-destructive'
                        }`}>
                          {result.score}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {failedViolations.length > 0 ? (
                          <Badge variant="outline" className="bg-destructive/5 border-destructive/20 text-foreground">
                            {failedViolations.length} found
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 border-0 text-emerald-500">
                            Clear
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(result.productId);
                        }}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>

                    <AnimatePresence>
                      {isExpanded && (
                        <TableRow className="bg-muted/5 border-0 hover:bg-muted/5">
                          <TableCell colSpan={5} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pl-12 space-y-3">
                                {failedViolations.length === 0 ? (
                                  <div className="flex items-center gap-2 text-sm text-emerald-500 py-2">
                                    <CheckCircle className="w-4 h-4" />
                                    This product is fully compliant across all target regions.
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                      Violations to Fix
                                    </h4>
                                    {failedViolations.map((violation, idx) => (
                                      <div key={idx} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background shadow-sm">
                                        <div className="flex gap-3">
                                          <div className="mt-0.5">
                                            {getSeverityIcon(violation.severity, false)}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <h5 className="font-semibold text-sm">{violation.ruleName}</h5>
                                              {getSeverityBadge(violation.severity)}
                                              <Badge variant="outline" className="text-xs uppercase">{violation.category}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{violation.message}</p>
                                            {violation.details && (
                                              <p className="text-xs text-muted-foreground mt-2 mt-1 border-l-2 border-primary/30 pl-2">
                                                {violation.details}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex-shrink-0 self-end sm:self-start">
                                          <Button 
                                            size="sm" 
                                            className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20"
                                            onClick={() => setSelectedViolation({ violation, product })}
                                          >
                                            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                                            Generate Fix
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <FixModal
        isOpen={selectedViolation !== null}
        onClose={() => setSelectedViolation(null)}
        violation={selectedViolation?.violation || null}
        product={selectedViolation?.product || null}
      />
    </>
  );
}
