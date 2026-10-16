"use client";

import { useState, useEffect } from "react";
import { Link2, AlertCircle, Store, Zap, CheckCircle2, RefreshCw, Key, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StorefrontWidgetModal } from "@/components/compliance/storefront-widget-modal";
import { EURepDirectory } from "@/components/compliance/eu-rep-directory";

export default function ConnectPage() {
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [shopDomain, setShopDomain] = useState("");
  const [customToken, setCustomToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<{
    name?: string;
    domain?: string;
    myshopifyDomain?: string;
    currency?: string;
    country?: string;
  } | null>(null);

  useEffect(() => {
    // Check initial connection status
    testConnection(false);
  }, []);

  const testConnection = async (showToast = true) => {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/shopify/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customShopDomain: shopDomain || undefined,
          customToken: customToken || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.shop) {
        setIsConnected(true);
        setConnectedShop(data.shop);
        if (showToast) {
          toast.success(`Successfully connected to ${data.shop.name} (${data.shop.myshopifyDomain})`);
        }
      } else {
        setIsConnected(false);
        setConnectedShop(null);
        if (showToast) {
          setErrorMsg(data.error || "Could not verify connection.");
          toast.error(data.error || "Connection test failed.");
        }
      }
    } catch {
      setIsConnected(false);
      if (showToast) {
        setErrorMsg("Failed to test connection.");
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleShopifyOAuthConnect = async () => {
    if (!shopDomain) {
      setErrorMsg("Please enter your Shopify shop domain.");
      return;
    }
    
    let cleanDomain = shopDomain.trim().toLowerCase();
    if (!cleanDomain.includes(".myshopify.com")) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    }

    setLoading(true);
    setErrorMsg("");
    window.location.href = `/api/shopify/auth?shop=${cleanDomain}`;
  };

  const handleRealTimeActivate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shopify/webhooks/register", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to activate real-time features. Ensure you are on a Pro plan.");
        toast.error(data.error || "Activation failed.");
      } else {
        toast.success("Real-time Pub/Sub webhooks activated successfully!");
      }
    } catch {
      setErrorMsg("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Store Connection & Integrations</h1>
          <p className="text-muted-foreground">Integrate platforms for one-touch scanning, real-time syncing, and storefront disclosures.</p>
        </div>
        <StorefrontWidgetModal />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Shopify Integration Card */}
        <Card className="glass border-border relative overflow-hidden">
          {isConnected && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#95BF47]/10 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-[#95BF47]" />
              </div>
              <div>
                <CardTitle className="text-lg">Shopify Store</CardTitle>
                <CardDescription>REST API + Pub/Sub Webhooks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Shopify store to enable direct product catalog scanning, 1-click self-healing compliance updates, and real-time firewall alerts.
            </p>
            
            {!isConnected ? (
              <div className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Shop Domain</label>
                  <div className="flex items-center">
                    <input 
                      type="text" 
                      placeholder="your-store" 
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      className="bg-background border border-r-0 border-border rounded-l-md px-3 py-2 text-sm w-full outline-none focus:border-primary"
                    />
                    <div className="bg-muted border border-border border-l-0 rounded-r-md px-3 py-2 text-sm text-muted-foreground">
                      .myshopify.com
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleShopifyOAuthConnect} 
                    disabled={loading} 
                    className="w-full bg-[#95BF47] text-white hover:bg-[#85ab3f] font-semibold"
                  >
                    {loading ? "Redirecting to Shopify..." : "Connect with Shopify OAuth"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(true)}
                    disabled={testingConnection}
                    className="w-full text-xs"
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Verifying Connection...
                      </>
                    ) : (
                      "Test Configured Credentials"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{connectedShop?.name || "Connected Store"}</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                    Live Verified
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Domain: <span className="font-mono text-foreground">{connectedShop?.domain || connectedShop?.myshopifyDomain || shopDomain}</span></p>
                  {connectedShop?.currency && <p>Currency: <span className="text-foreground">{connectedShop.currency}</span> • Country: <span className="text-foreground">{connectedShop.country || "Global"}</span></p>}
                </div>
                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(true)}
                    disabled={testingConnection}
                    className="text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${testingConnection ? "animate-spin" : ""}`} />
                    Re-Verify
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsConnected(false); setConnectedShop(null); }}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Etsy Integration Card */}
        <Card className="glass border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F56400]/10 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-[#F56400]" />
              </div>
              <div>
                <CardTitle className="text-lg">Etsy Store</CardTitle>
                <CardDescription>CSV Importer & Listing Audit</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Etsy sellers can export their active listing data from <b>Shop Manager → Settings → Download Data</b> and upload it directly to List Guard to audit GPSR and LUCID packaging compliance.
            </p>
            <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>CSV Upload Support</span>
                <span className="text-emerald-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 100% Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatic mapping of Etsy listing titles, materials, tags, prices, and shipping destinations.
              </p>
            </div>
            <Button variant="outline" asChild className="w-full">
              <a href="/app/scan">
                Go to Scan Page to Upload CSV →
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Compliance Guard */}
      <Card className="glass-strong border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-amber-500" />
            <CardTitle>Real-Time Compliance Firewall</CardTitle>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white ml-2">PRO</Badge>
          </div>
          <CardDescription>
            Automatically audit products the second they go live on your store using Google Cloud Pub/Sub & Webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            When activated, List Guard hooks into your Shopify store and acts as an immediate firewall. If a new or edited product violates GPSR, California Prop 65, or misses EU customs disclosures, we instantly notify you via Slack or Email before customs or regulators notice.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Button 
               onClick={handleRealTimeActivate} 
               disabled={loading}
               className="bg-primary hover:bg-primary/90"
            >
              {loading ? "Registering Webhooks..." : "Activate Real-Time Webhooks"}
            </Button>
            <span className="text-xs text-muted-foreground">Supported service account: delivery@shopify-pubsub-webhooks.iam.gserviceaccount.com</span>
          </div>
        </CardContent>
      </Card>

      {/* EU Responsible Person Directory */}
      <EURepDirectory />
    </div>
  );
}
