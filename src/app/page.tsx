"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  AlertTriangle,
  Globe,
  FileCheck,
  Copy,
  ArrowRight,
  CheckCircle,
  XCircle,
  Star,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Clock,
  TrendingUp,
  Lock,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { useState } from "react";

import { HSCodeLookup } from "@/components/marketing/hs-code-lookup";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold gradient-text">
                List Guard
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
              <Link href="/app/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/app/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Scan Free
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden glass-strong border-t border-border"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#pricing" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <Link href="/app/login" className="block">
                <Button className="w-full">Scan Free</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-6"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium glass">
                <Sparkles className="w-3 h-3 mr-1" />
                Now with July 2026 EU Customs Coverage
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight"
            >
              Never get{" "}
              <span className="gradient-text">fined</span> or{" "}
              <span className="gradient-text">delisted</span> again
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              AI scans your Shopify/Etsy store for GDPR, GPSR, Prop 65 & 2026
              customs rules — in 60 seconds. Built for small sellers who can&apos;t
              afford lawyers.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link href="/app/login">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 animate-glow"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Scan My Store Free
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                No credit card needed
              </p>
            </motion.div>

            {/* Mini compliance preview */}
            <motion.div
              variants={fadeUp}
              className="mt-12 max-w-3xl mx-auto"
            >
              <div className="glass rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    list-guard scan results
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Missing GDPR Privacy Policy", severity: "critical", icon: XCircle, color: "text-red-400" },
                    { name: "No EU Responsible Person (GPSR)", severity: "critical", icon: XCircle, color: "text-red-400" },
                    { name: "Prop 65 chemicals detected — no warning", severity: "warning", icon: AlertTriangle, color: "text-amber-400" },
                    { name: "EU €3 duty not disclosed", severity: "info", icon: FileCheck, color: "text-cyan-400" },
                    { name: "PPWR packaging info present", severity: "passed", icon: CheckCircle, color: "text-emerald-400" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Badge
                        variant={item.severity === "passed" ? "default" : "secondary"}
                        className={`text-xs ${
                          item.severity === "critical"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : item.severity === "warning"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : item.severity === "passed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        }`}
                      >
                        {item.severity}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              2026 is <span className="text-destructive">crushing</span> small sellers
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto">
              New regulations are hitting every quarter. One missed rule = delistings, fines, or lost revenue overnight.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Globe,
                title: "GPSR Delistings",
                description: "Missing EU Responsible Person? Marketplaces now auto-remove your listings overnight. No warning.",
                stat: "Enforced Dec 2024",
                color: "text-red-400",
                bgColor: "bg-red-500/10",
              },
              {
                icon: Lock,
                title: "GDPR Fines",
                description: "SME fines now average €50K–€200K. A missing privacy policy or cookie banner can trigger enforcement.",
                stat: "€50K+ avg fine",
                color: "text-amber-400",
                bgColor: "bg-amber-500/10",
              },
              {
                icon: TrendingUp,
                title: "EU €3 Customs Duty",
                description: "July 2026: every parcel under €150 gets a flat €3 duty. End of de-minimis. Buyers will be surprised.",
                stat: "July 1, 2026",
                color: "text-cyan-400",
                bgColor: "bg-cyan-500/10",
              },
            ].map((card) => (
              <motion.div key={card.title} variants={fadeUp}>
                <Card className="glass border-border hover:border-primary/30 transition-all duration-300 h-full group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                    <Badge variant="secondary" className={`${card.bgColor} ${card.color} border-0`}>
                      {card.stat}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Three steps to compliance peace of mind
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground">
              From zero to fully scanned in under 60 seconds
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                step: "01",
                icon: Zap,
                title: "Connect",
                description: "One-click Shopify OAuth or drag-and-drop your Etsy CSV export. We auto-detect your store setup.",
              },
              {
                step: "02",
                icon: ShieldCheck,
                title: "Scan",
                description: "AI analyzes every listing for GDPR, GPSR, Prop 65, customs rules, and shipping restrictions—per region.",
              },
              {
                step: "03",
                icon: Copy,
                title: "Fix",
                description: "Get ready-to-paste legal text: privacy policies, GPSR labels, Prop 65 warnings, duty notices. One click.",
              },
            ].map((step, i) => (
              <motion.div key={step.step} variants={fadeUp} className="relative">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HS Code Lead Magnet Section */}
      <section className="py-20 px-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-6"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold">
              Stop the <span className="gradient-text">guesswork</span> with HS codes
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground">
              By July 2026, every EU-bound parcel needs a precise 6-8 digit HS code to avoid being returned or held at customs. Our AI helps you find the right one in seconds.
            </motion.p>
            <motion.ul variants={fadeUp} className="space-y-3">
              {[
                "Compliant with July 2026 €3 flat duty rules",
                "Optimized for handmade & POD products",
                "Reduces shipping delays by 40%",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <HSCodeLookup />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Every compliance rule, <span className="gradient-text">covered</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto">
              13 real-time checks across GDPR, GPSR, Prop 65, customs, shipping, and more. AI-powered analysis with ready-to-paste fixes.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Lock, title: "GDPR Privacy & Cookies", desc: "Detects missing privacy policies and cookie consent banners. Generates compliant text instantly.", color: "text-cyan-400" },
              { icon: ShieldCheck, title: "GPSR Compliance", desc: "Checks for EU Responsible Person, safety documentation, batch numbers, and recall procedures.", color: "text-emerald-400" },
              { icon: AlertTriangle, title: "Prop 65 Warnings", desc: "AI detects Prop 65 chemicals in product descriptions and generates Safe Harbor warning text.", color: "text-amber-400" },
              { icon: Globe, title: "EU Customs 2026", desc: "Flags products missing HS codes and €3 duty notices for the July 2026 EU customs reform.", color: "text-cyan-400" },
              { icon: FileCheck, title: "Shipping Restrictions", desc: "Identifies products shipping to sanctioned or restricted countries. WEEE/RoHS alerts for electronics.", color: "text-emerald-400" },
              { icon: Clock, title: "Weekly Alerts", desc: "Automated weekly scans with email and Slack notifications. Never miss a rule change.", color: "text-amber-400" },
            ].map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="glass border-border hover:border-primary/30 transition-all duration-300 h-full group cursor-default">
                  <CardContent className="pt-6">
                    <feature.icon className={`w-8 h-8 ${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Sellers love List Guard
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                name: "Sarah M.",
                role: "Etsy Jewelry Seller",
                text: "Found 7 GPSR violations I had no idea about. The fix generator saved me hours of research.",
                stars: 5,
              },
              {
                name: "Marcus K.",
                role: "Shopify POD Store",
                text: "My EU listings were getting flagged constantly. List Guard caught the missing Responsible Person info immediately.",
                stars: 5,
              },
              {
                name: "Elena R.",
                role: "Handmade Cosmetics",
                text: "The Prop 65 scanner alone is worth it. I was unknowingly selling products with flagged chemicals in California.",
                stars: 5,
              },
            ].map((testimonial) => (
              <motion.div key={testimonial.name} variants={fadeUp}>
                <Card className="glass border-border h-full">
                  <CardContent className="pt-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: testimonial.stars }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, Fair Pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground">
              Built for solo sellers. No enterprise bloat.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {/* Free */}
            <motion.div variants={fadeUp}>
              <Card className="glass border-border h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Free</CardTitle>
                  <p className="text-sm text-muted-foreground">Try before you buy</p>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/forever</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["5 products per scan", "Basic rule checks", "1 region", "CSV upload only"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <Link href="/app/login" className="block pt-4">
                    <Button variant="outline" className="w-full">
                      Start Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Monthly */}
            <motion.div variants={fadeUp}>
              <Card className="border-primary/50 shadow-lg shadow-primary/10 h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-400" />
                <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                  Popular
                </Badge>
                <CardHeader>
                  <CardTitle className="text-lg">Pro</CardTitle>
                  <p className="text-sm text-muted-foreground">Everything you need</p>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$15</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Unlimited products",
                    "AI deep analysis",
                    "All 13 compliance rules",
                    "All regions (EU, US, UK, CA, IN)",
                    "Fix generator",
                    "Weekly email alerts",
                    "Shopify OAuth connect",
                    "Scan history (30 days)",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <Link href="/app/login" className="block pt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Get Pro
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Lifetime */}
            <motion.div variants={fadeUp}>
              <Card className="glass border-border h-full relative overflow-hidden">
                <Badge className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Best Value
                </Badge>
                <CardHeader>
                  <CardTitle className="text-lg">Lifetime</CardTitle>
                  <p className="text-sm text-muted-foreground">Pay once, scan forever</p>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">$149</span>
                    <span className="text-muted-foreground"> one-time</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Everything in Pro",
                    "Lifetime updates",
                    "Priority support",
                    "Early access to new rules",
                    "First 300 users only",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  <Link href="/app/login" className="block pt-4">
                    <Button variant="outline" className="w-full border-amber-500/30 hover:bg-amber-500/10">
                      Get Lifetime
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </motion.h2>

            <motion.div variants={fadeUp}>
              <Accordion type="single" collapsible className="space-y-3">
                {[
                  {
                    q: "Do I need a Shopify Plus plan?",
                    a: "No. List Guard works with any Shopify plan, including Basic. We also support Etsy and any platform via CSV upload.",
                  },
                  {
                    q: "What compliance rules does List Guard check?",
                    a: "13 rules across GDPR (privacy policy, cookies), GPSR (EU Responsible Person, safety docs, batch numbers, recall procedures), California Prop 65, age restrictions, prohibited items, shipping restrictions, EU customs 2026 (HS codes, €3 duty), and PPWR packaging.",
                  },
                  {
                    q: "Is my store data safe?",
                    a: "Absolutely. We follow a privacy-first approach: product data is analyzed in real-time and never permanently stored. Scan results auto-delete after 30 days. We never share your data.",
                  },
                  {
                    q: "What happens after scanning?",
                    a: "You get a color-coded compliance score (0-100) with specific violations per product. One click generates ready-to-paste legal text for each issue: privacy policies, GPSR labels, Prop 65 warnings, duty notices, etc.",
                  },
                  {
                    q: "Can I use this for Etsy?",
                    a: "Yes! While we offer direct Shopify OAuth, Etsy sellers can export their listings as CSV from Shop Manager → Settings → Download Data, then upload to List Guard.",
                  },
                  {
                    q: "What about the July 2026 EU customs changes?",
                    a: "List Guard flags all products under €150 shipping to the EU that don't mention the new €3 flat duty. It also suggests HS codes and generates buyer-facing customs notices.",
                  },
                  {
                    q: "Why $15/month and not $100+?",
                    a: "Enterprise compliance tools are built for large companies. List Guard is laser-focused on solo sellers and micro-businesses. We keep costs low so compliance isn't a luxury.",
                  },
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-xl px-4 border-border">
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Stop losing sales to compliance mistakes
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join 300+ small sellers who scan their stores weekly. First scan is always free.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/app/login">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Scan My Store Free — No Card Needed
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold gradient-text">List Guard</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                AI-powered compliance scanner for small Shopify & Etsy sellers.
                Avoid fines, delistings, and revenue loss.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">Features</a>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</a>
                <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 List Guard. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:hello@listguard.app" className="text-muted-foreground hover:text-foreground">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
