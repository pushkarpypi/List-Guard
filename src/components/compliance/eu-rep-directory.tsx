"use client";

import { Shield, ExternalLink, CheckCircle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Partner {
  name: string;
  type: string;
  price: string;
  description: string;
  bestFor: string;
  url: string;
}

const PARTNERS: Partner[] = [
  {
    name: "EUverify",
    type: "Dedicated EU Responsible Person",
    price: "From €99/year",
    description: "Specialized low-cost EU Authorized Representative service for small makers, Etsy sellers, and Shopify boutique brands.",
    bestFor: "Small handmade & boutique e-commerce stores",
    url: "https://euverify.com",
  },
  {
    name: "Authorized Rep EU",
    type: "EU / UK Authorized Representative",
    price: "From €190/year",
    description: "Full regulatory representation in Dublin & Berlin. Provides an EU postal address, email, and technical documentation storage.",
    bestFor: "Electronics, cosmetics & manufactured goods",
    url: "https://authorizedrep.eu",
  },
  {
    name: "EPR Germany (LUCID Partner)",
    type: "Packaging Registration (VerpackG)",
    price: "Free registration + recycling fee",
    description: "Official dual system packaging broker for Germany (LUCID ID) and France (SYDEREP ID).",
    bestFor: "Any seller shipping physical packages to Germany/France",
    url: "https://lucid.verpackungsregister.org",
  },
];

export function EURepDirectory() {
  return (
    <Card className="glass border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">EU Responsible Person (RP) Directory</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
            GPSR 2023/988 Ready
          </Badge>
        </div>
        <CardDescription>
          Don't have an EU office? Non-EU merchants must appoint an EU-based Responsible Person to legally ship physical goods into the European Union.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="p-4 rounded-xl border border-border bg-background/50 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{partner.name}</h4>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20">
                    {partner.price}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {partner.description}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-primary mb-3">
                  Best for: {partner.bestFor}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7 gap-1"
                  asChild
                >
                  <a href={partner.url} target="_blank" rel="noopener noreferrer">
                    <span>View Partner</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            <b>Are you based inside the EU?</b> If your business is legally registered in an EU member state, you (the manufacturer) act as your own EU Responsible Person. You only need to enter your registered business address.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
