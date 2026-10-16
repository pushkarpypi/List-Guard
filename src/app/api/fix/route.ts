import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFixText } from "@/lib/compliance/ai-analyzer";
import type { RuleResult, Product } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { violation, product, language }: {
      violation: RuleResult;
      product: Product;
      language?: "en" | "es";
    } = body;

    if (!violation || !product) {
      return NextResponse.json({ error: "Missing violation or product data" }, { status: 400 });
    }

    // Check plan: only Pro/Lifetime users get AI fix generation
    // Guests can see the fix structure but not AI-generated content
    const isAuthenticated = !!user;
    let canGenerateFix = false;

    if (isAuthenticated && user) {
      const { data: usage } = await supabase
        .from("user_usage")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (usage && (usage.plan === "monthly" || usage.plan === "lifetime")) {
        canGenerateFix = true;
      }
    }

    if (!canGenerateFix) {
      // Return a teaser — show structure, blur content
      return NextResponse.json({
        teaser: true,
        ruleId: violation.ruleId,
        ruleName: violation.ruleName,
        category: violation.category,
        message: "Upgrade to Pro to generate ready-to-paste compliance fixes using AI.",
      }, { status: 402 });
    }

    const fix = await generateFixText(violation, product, language || "en");

    if (!fix) {
      return NextResponse.json({ error: "Fix generation failed. Please try again." }, { status: 500 });
    }

    return NextResponse.json(fix);
  } catch (error) {
    console.error("Fix generation error:", error);
    return NextResponse.json(
      { error: "Fix generation failed. Please try again." },
      { status: 500 }
    );
  }
}
