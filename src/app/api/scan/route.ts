import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkProductCompliance, calculateScore } from "@/lib/compliance/scanner";
import { analyzeProductWithAI } from "@/lib/compliance/ai-analyzer";
import type { Product, StoreConfig, ScanSummary, ProductScanResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { products, config, isGuest }: {
      products: Product[];
      config: StoreConfig;
      isGuest?: boolean;
    } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided" }, { status: 400 });
    }

    if (!config || !config.regions || config.regions.length === 0) {
      return NextResponse.json({ error: "No regions selected" }, { status: 400 });
    }

    // Enforce free tier limit: guests & free users get 5 products
    const isAuthenticated = !!user;
    let productLimit = 5;
    let plan: "free" | "monthly" | "lifetime" = "free";

    if (isAuthenticated && user) {
      // Check user plan from DB
      const { data: usage } = await supabase
        .from("user_usage")
        .select("plan, scans_this_month, products_scanned_total")
        .eq("user_id", user.id)
        .single();

      if (usage) {
        plan = usage.plan as "free" | "monthly" | "lifetime";
        if (plan === "monthly" || plan === "lifetime") {
          productLimit = 10000; // effectively unlimited
        }
      }
    }

    const productsToScan = products.slice(0, productLimit);

    // Run compliance scans
    const results: ProductScanResult[] = await Promise.all(
      productsToScan.map(async (product) => {
        // Rule-based checks (fast, synchronous)
        const ruleResults = checkProductCompliance(product, config);

        // AI-powered deep analysis (async, Gemini)
        const aiResults = await analyzeProductWithAI(product, config.regions);

        // Merge: deduplicate by ruleId, AI results augment rule results
        const allViolations = [...ruleResults];
        for (const aiResult of aiResults) {
          const alreadyHas = allViolations.some(
            (r) => r.category === aiResult.category && !r.passed && !aiResult.passed
          );
          if (!alreadyHas) {
            allViolations.push(aiResult);
          }
        }

        const score = calculateScore(allViolations);

        return {
          productId: product.id,
          productTitle: product.title,
          violations: allViolations,
          score,
          fixesGenerated: [],
        };
      })
    );

    // Compute summary
    const totalViolations = results.flatMap((r) => r.violations.filter((v) => !v.passed));
    const criticalCount = totalViolations.filter((v) => v.severity === "critical").length;
    const warningCount = totalViolations.filter((v) => v.severity === "warning").length;
    const infoCount = totalViolations.filter((v) => v.severity === "info").length;
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 100;

    const scanId = crypto.randomUUID();
    const now = new Date().toISOString();

    const summary: ScanSummary = {
      id: scanId,
      totalProducts: productsToScan.length,
      issuesFound: totalViolations.length,
      criticalCount,
      warningCount,
      infoCount,
      complianceScore: avgScore,
      regions: config.regions,
      status: "completed",
      createdAt: now,
      completedAt: now,
      results,
    };

    // Persist user_usage only (Cloud ZERO-STORAGE policy for product scan data)
    if (isAuthenticated && user) {
      // Update usage counters
      await supabase.from("user_usage").upsert({
        user_id: user.id,
        plan,
        scans_this_month: 1,
        products_scanned_total: productsToScan.length,
        updated_at: now,
      }, { onConflict: "user_id", ignoreDuplicates: false });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Scan failed. Please try again." },
      { status: 500 }
    );
  }
}
