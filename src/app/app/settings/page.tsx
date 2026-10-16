"use client";

import { useEffect, useState } from "react";
import { User, Bell, Shield, LogOut, Loader2 } from "lucide-react";
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

export default function SettingsPage() {
  const { t } = useTranslation();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [weeklyScans, setWeeklyScans] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
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
    if (!user) return;
    
    try {
      await supabase.from("user_usage").update({
        email_alerts: emailAlerts,
        weekly_scan_enabled: weeklyScans,
        slack_webhook: slackWebhook,
      }).eq("user_id", user.id);
      
      toast.success("Preferences saved successfully!");
    } catch (error) {
      toast.error("Failed to save preferences.");
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
        <h1 className="text-2xl font-bold tracking-tight">Settings & Billing</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and subscription.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Navigation */}
        <div className="space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <User className="w-4 h-4 mr-2" />
            Account Details
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Right Column - Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Billing Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Subscription
            </h2>
            <UpgradeBanner currentPlan={currentPlan} email={user?.email} />
          </section>

          {/* Account Form */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-xl font-bold">Profile</h2>
            <Card className="glass border-border">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <div className="mt-1 flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <span className="text-sm">{user?.email || "Guest User"}</span>
                    {!user && (
                      <Badge variant="secondary">Not Authenticated</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Account ID</Label>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {user?.id || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Automations */}
          <section className="space-y-4 pt-4 border-t border-border">
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
                 <Button onClick={handleSavePreferences} disabled={!isPremium}>
                   Save Preferences
                 </Button>
              </CardFooter>
            </Card>
          </section>

          {/* Storefront Embed & Widgets */}
          <section className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Storefront Disclosures</h2>
                <p className="text-xs text-muted-foreground">Liquid code for theme integration with smart California & EU Geo-Fencing.</p>
              </div>
              <StorefrontWidgetModal />
            </div>
          </section>

          {/* EU Representative Directory */}
          <section className="space-y-4 pt-4 border-t border-border">
            <EURepDirectory />
          </section>
          
        </div>
      </div>
    </div>
  );
}
