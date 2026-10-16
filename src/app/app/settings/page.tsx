"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Bell, Shield, LogOut, Loader2, Save, Building2, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UpgradeBanner } from "@/components/billing/upgrade-banner";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EURepDirectory } from "@/components/compliance/eu-rep-directory";
import { StorefrontWidgetModal } from "@/components/compliance/storefront-widget-modal";
import { saveMerchantProfileLocally, getMerchantProfileLocally } from "@/lib/storage";

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "gpsr" | "billing">("account");
  
  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [weeklyScans, setWeeklyScans] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");

  // EU Responsible Person Fields (GPSR Mandate)
  const [rpName, setRpName] = useState("");
  const [rpAddress, setRpAddress] = useState("");
  const [rpEmail, setRpEmail] = useState("");
  const [rpPhone, setRpPhone] = useState("");

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Load local profile from encrypted storage
    const localProf = await getMerchantProfileLocally();
    if (localProf?.responsiblePerson) {
      setRpName(localProf.responsiblePerson.name || "");
      setRpAddress(localProf.responsiblePerson.address || "");
      setRpEmail(localProf.responsiblePerson.email || "");
      setRpPhone(localProf.responsiblePerson.phone || "");
    }

    if (user) {
      setUser(user);
      const { data } = await supabase
        .from("user_usage")
        .select("*")
        .eq("user_id", user.id)
        .single();
        
      if (data) {
        setUsage(data);
        setEmailAlerts(data.email_alerts || false);
        setWeeklyScans(data.weekly_scan_enabled || false);
        setSlackWebhook(data.slack_webhook || "");
      } else {
        setUsage({ plan: "free" });
      }
    } else {
      // Guest mode
      setUsage({ plan: "free", isGuest: true });
    }
    
    setLoading(false);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // 1. Save RP locally in zero-cloud AES-GCM IndexedDB
      await saveMerchantProfileLocally({
        responsiblePerson: {
          name: rpName,
          address: rpAddress,
          email: rpEmail,
          phone: rpPhone,
        },
      });

      // 2. If authenticated, upsert usage preferences into Supabase
      if (user) {
        const { error } = await supabase.from("user_usage").upsert({
          user_id: user.id,
          email_alerts: emailAlerts,
          weekly_scan_enabled: weeklyScans,
          slack_webhook: slackWebhook,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (error) throw error;
      }
      
      toast.success("Settings and EU Responsible Person profile saved!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem("listguard_guest");
      document.cookie = "listguard_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.success("Signed out successfully");
      router.push("/app/login");
    } catch (e) {
      router.push("/app/login");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentPlan = usage?.plan || "free";
  const isPremium = currentPlan === "monthly" || currentPlan === "lifetime";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Profile</h1>
        <p className="text-muted-foreground">Manage your merchant entity, EU GPSR credentials, and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Navigation */}
        <div className="space-y-2">
          <Button 
            variant={activeTab === "account" ? "secondary" : "ghost"} 
            className="w-full justify-start text-xs font-semibold"
            onClick={() => setActiveTab("account")}
          >
            <User className="w-4 h-4 mr-2" />
            Account & Profile
          </Button>

          <Button 
            variant={activeTab === "gpsr" ? "secondary" : "ghost"} 
            className="w-full justify-start text-xs font-semibold"
            onClick={() => setActiveTab("gpsr")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            EU Responsible Person
          </Button>

          <Button 
            variant={activeTab === "notifications" ? "secondary" : "ghost"} 
            className="w-full justify-start text-xs font-semibold"
            onClick={() => setActiveTab("notifications")}
          >
            <Bell className="w-4 h-4 mr-2" />
            Automations & Slack
          </Button>

          <Button 
            variant={activeTab === "billing" ? "secondary" : "ghost"} 
            className="w-full justify-start text-xs font-semibold"
            onClick={() => setActiveTab("billing")}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription & Plan
          </Button>

          <div className="pt-4 border-t border-border">
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Tab 1: Account Profile */}
          {activeTab === "account" && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Account Profile</h2>
              <Card className="glass border-border">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Authenticated Email</Label>
                    <div className="mt-1 flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <span className="text-sm font-medium">{user?.email || "Guest Session (Free Tier)"}</span>
                      {!user && (
                        <Badge variant="secondary">Guest Mode</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>User ID / Security Principal</Label>
                    <p className="text-xs text-muted-foreground font-mono mt-1 select-all">
                      {user?.id || "local-guest-user"}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border">
                    <span>Data Privacy Protection</span>
                    <span className="text-emerald-500 font-medium">AES-GCM (256-bit) Encrypted</span>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Tab 2: EU Responsible Person (GPSR Article 16) */}
          {activeTab === "gpsr" && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  EU Responsible Person (GPSR)
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">Mandatory for EU Sales</Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Under EU GPSR Regulation (EU 2023/988), all non-EU merchants must declare an authorized EU representative with physical postal address on listings.
                </p>
              </div>

              <Card className="glass border-border">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Responsible Person Legal Name or Entity</Label>
                    <input
                      type="text"
                      placeholder="e.g. EU Compliance Partner ApS or John Doe"
                      value={rpName}
                      onChange={(e) => setRpName(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <Label>EU Postal Address (Street, City, Postal Code, Country)</Label>
                    <input
                      type="text"
                      placeholder="e.g. Friedrichstraße 123, 10117 Berlin, Germany"
                      value={rpAddress}
                      onChange={(e) => setRpAddress(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Contact Email</Label>
                      <input
                        type="email"
                        placeholder="compliance@eupartner.eu"
                        value={rpEmail}
                        onChange={(e) => setRpEmail(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label>Contact Phone (Optional)</Label>
                      <input
                        type="tel"
                        placeholder="+49 30 1234567"
                        value={rpPhone}
                        onChange={(e) => setRpPhone(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t border-border mt-4 flex justify-between items-center pb-4 pt-4 bg-muted/10 rounded-b-xl">
                  <p className="text-[11px] text-muted-foreground">Automatically verified against GPSR rule engines during catalog scans.</p>
                  <Button onClick={handleSavePreferences} disabled={saving} size="sm">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Save Entity
                  </Button>
                </CardFooter>
              </Card>

              {/* Vetted EU Rep Partner Directory */}
              <EURepDirectory />
            </section>
          )}

          {/* Tab 3: Automations & Notifications */}
          {activeTab === "notifications" && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Automations & Webhooks
                {!isPremium && <Badge variant="secondary" className="text-[10px] ml-2">PRO</Badge>}
              </h2>
              
              <Card className="glass border-border">
                <CardContent className="pt-6 space-y-6">
                  <div className={`flex items-center justify-between ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Scan Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive a summary of your compliance score every Monday.</p>
                    </div>
                    <Switch 
                       checked={weeklyScans && isPremium} 
                       onCheckedChange={setWeeklyScans}
                    />
                  </div>

                  <div className={`flex items-center justify-between ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-0.5">
                      <Label className="text-base">Instant Compliance Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified immediately upon a new violation.</p>
                    </div>
                    <Switch 
                      checked={emailAlerts && isPremium}
                      onCheckedChange={setEmailAlerts}
                    />
                  </div>

                  <div className={`pt-4 border-t border-border space-y-3 ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Label>Slack Webhook URL</Label>
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={slackWebhook}
                      onChange={(e) => setSlackWebhook(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">We'll ping this channel if a critical violation is found.</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t border-border mt-4 flex justify-end pb-4 pt-4 bg-muted/10 rounded-b-xl">
                   <Button onClick={handleSavePreferences} disabled={!isPremium || saving}>
                     {saving ? "Saving..." : "Save Preferences"}
                   </Button>
                </CardFooter>
              </Card>
            </section>
          )}

          {/* Tab 4: Billing & Subscription */}
          {activeTab === "billing" && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold">Subscription & Plan</h2>
              <UpgradeBanner currentPlan={currentPlan} email={user?.email} />

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Storefront Disclosures Widget</h3>
                    <p className="text-xs text-muted-foreground">Geo-Fenced Liquid snippet for your online shop.</p>
                  </div>
                  <StorefrontWidgetModal />
                </div>
              </div>
            </section>
          )}
          
        </div>
      </div>
    </div>
  );
}
