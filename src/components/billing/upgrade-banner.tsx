"use client";

import { useEffect, useState } from "react";
import { Paddle, initializePaddle } from "@paddle/paddle-js";
import { Crown, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UpgradeBannerProps {
  currentPlan: "free" | "monthly" | "lifetime";
  email?: string;
}

export function UpgradeBanner({ currentPlan, email }: UpgradeBannerProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Determine the theme dynamically based on the dark mode class
    const isDark = document.documentElement.classList.contains("dark");
    
    initializePaddle({
      environment: "sandbox", // use "production" in prod
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          window.location.href = "/app/dashboard?success=true";
        }
      },
      checkout: {
        settings: {
          theme: isDark ? "dark" : "light",
        }
      }
    }).then(
      (paddleInstance: Paddle | undefined) => {
        if (paddleInstance) {
           setPaddle(paddleInstance);
        }
      }
    );
  }, []);

  const openCheckout = (priceId: string) => {
    if (!paddle) return;
    setLoading(true);
    
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
    });
    
    setLoading(false);
  };

  if (currentPlan === "lifetime") {
    return (
      <Card className="glass-strong border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                Lifetime Member <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </h3>
              <p className="text-sm text-muted-foreground">You have permanent access to all List Guard features.</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">Active</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Monthly Plan */}
      <Card className={`glass border-border relative overflow-hidden ${currentPlan === "monthly" ? "border-primary/50 shadow-lg shadow-primary/10" : ""}`}>
        {currentPlan === "monthly" && (
          <div className="absolute top-0 right-0 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground rounded-bl-lg">
            Current Plan
          </div>
        )}
        <CardHeader>
          <CardTitle>Pro Monthly</CardTitle>
          <CardDescription>Everything you need for ongoing compliance.</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">$15</span>
            <span className="text-muted-foreground">/mo</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-8">
          {[
            "Unlimited products",
            "AI deep analysis for fixes",
            "All 13 compliance rules",
            "Real-time Shopify webhooks",
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </CardContent>
        <CardFooter className="pt-0">
          {currentPlan === "free" ? (
             <Button 
                onClick={() => openCheckout("pri_01knnyhx8mt220nysnt1c0r5qk")} 
                disabled={loading || !paddle} 
                className="w-full bg-primary hover:bg-primary/90"
             >
               {loading ? "Loading..." : "Upgrade to Pro"}
             </Button>
          ) : (
             <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">
               Cancel Subscription
             </Button>
          )}
        </CardFooter>
      </Card>

      {/* Lifetime Plan */}
      <Card className="glass-strong border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
         <Badge className="absolute top-4 right-4 bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-lg animate-pulse-slow">
           Best Value
         </Badge>
         <CardHeader>
          <div className="flex items-center gap-2 mb-1">
             <Sparkles className="w-5 h-5 text-amber-500" />
             <CardTitle>Lifetime VIP</CardTitle>
          </div>
          <CardDescription>Pay once. Scan forever. Stop paying subscriptions.</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">$149</span>
            <span className="text-muted-foreground line-through ml-2 text-sm">$300</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-8">
          {[
            "Everything in Pro Monthly",
            "No recurring fees ever",
            "Priority support",
            "First 300 users only"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
             onClick={() => openCheckout("pri_01knnyhx8mt220nysnt1c0r5ql")} 
             disabled={loading || !paddle} 
             className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          >
            {loading ? "Loading..." : "Get Lifetime Access"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
