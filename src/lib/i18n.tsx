"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Locale, TranslationStrings } from "./types";

const translations: Record<Locale, TranslationStrings> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.newScan": "New Scan",
    "nav.history": "Scan History",
    "nav.settings": "Settings",
    "nav.connect": "Connect Store",
    "nav.upgrade": "Upgrade Plan",
    "nav.logout": "Sign Out",

    // Dashboard
    "dash.title": "Compliance Dashboard",
    "dash.subtitle": "Your store's compliance health at a glance",
    "dash.totalProducts": "Total Products",
    "dash.issuesFound": "Issues Found",
    "dash.criticalIssues": "Critical",
    "dash.complianceScore": "Compliance Score",
    "dash.recentScan": "Recent Scan Results",
    "dash.noScans": "No scans yet. Run your first scan to check compliance.",
    "dash.startScan": "Start New Scan",

    // Scan
    "scan.title": "Compliance Scan",
    "scan.subtitle": "Select target regions and start scanning",
    "scan.selectRegions": "Target Regions",
    "scan.startScan": "Start Scan",
    "scan.scanning": "Scanning...",
    "scan.results": "Scan Results",
    "scan.score": "Compliance Score",
    "scan.issues": "Issues",
    "scan.noIssues": "No issues found!",
    "scan.generateFixes": "Generate Fixes",
    "scan.generateAllFixes": "Generate All Fixes",
    "scan.exportCSV": "Export CSV",
    "scan.exportPDF": "Export PDF",

    // Fixes
    "fix.title": "Generated Fix",
    "fix.copyToClipboard": "Copy to Clipboard",
    "fix.copied": "Copied!",
    "fix.applyFix": "Apply Fix",
    "fix.language": "Language",

    // Connect
    "connect.title": "Connect Your Store",
    "connect.subtitle": "Link your Shopify store or upload a CSV file",
    "connect.shopify": "Connect Shopify",
    "connect.shopifyDesc": "One-click OAuth to scan your live store",
    "connect.csv": "Upload CSV",
    "connect.csvDesc": "Upload your Etsy or any store CSV export",
    "connect.dragDrop": "Drag & drop your CSV file here, or click to browse",
    "connect.sampleCSV": "Download Sample CSV",
    "connect.connected": "Store Connected",
    "connect.processing": "Processing...",

    // Settings
    "settings.title": "Settings",
    "settings.regions": "Default Regions",
    "settings.notifications": "Notifications",
    "settings.email": "Email Alerts",
    "settings.slack": "Slack Webhook",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.darkMode": "Dark Mode",
    "settings.account": "Account",
    "settings.plan": "Current Plan",
    "settings.delete": "Delete Account",

    // Pricing
    "pricing.title": "Simple, Fair Pricing",
    "pricing.subtitle": "Built for solo sellers who can't afford enterprise tools",
    "pricing.monthly": "Monthly",
    "pricing.lifetime": "Lifetime",
    "pricing.free": "Free",
    "pricing.freeDesc": "Try before you buy",
    "pricing.freeFeature1": "5 products per scan",
    "pricing.freeFeature2": "Basic compliance checks",
    "pricing.freeFeature3": "1 region",
    "pricing.pro": "Pro",
    "pricing.proPrice": "$15",
    "pricing.proDesc": "Everything you need",
    "pricing.proFeature1": "Unlimited products",
    "pricing.proFeature2": "AI-powered deep analysis",
    "pricing.proFeature3": "All regions",
    "pricing.proFeature4": "Weekly email alerts",
    "pricing.proFeature5": "Fix generator",
    "pricing.lifetimePrice": "$149",
    "pricing.lifetimeDesc": "Pay once, scan forever",
    "pricing.cta": "Get Started",
    "pricing.ctaFree": "Scan Free",

    // Auth
    "auth.login": "Sign In",
    "auth.signup": "Create Account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.magicLink": "Send Magic Link",
    "auth.google": "Continue with Google",
    "auth.guest": "Try as Guest",
    "auth.checkEmail": "Check your email for a login link!",

    // Landing Page
    "hero.title": "Never get fined or delisted again",
    "hero.subtitle": "AI scans your Shopify/Etsy store for GDPR, GPSR, Prop 65 & 2026 customs rules — in 60 seconds.",
    "hero.cta": "Scan My Store Free",
    "hero.ctaSub": "No credit card needed",

    // Common
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Retry",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.critical": "Critical",
    "common.warning": "Warning",
    "common.info": "Info",
    "common.passed": "Passed",
  },
  es: {
    "nav.dashboard": "Panel",
    "nav.newScan": "Nuevo Escaneo",
    "nav.history": "Historial",
    "nav.settings": "Configuración",
    "nav.connect": "Conectar Tienda",
    "nav.upgrade": "Mejorar Plan",
    "nav.logout": "Cerrar Sesión",

    "dash.title": "Panel de Cumplimiento",
    "dash.subtitle": "La salud de cumplimiento de tu tienda",
    "dash.totalProducts": "Total Productos",
    "dash.issuesFound": "Problemas",
    "dash.criticalIssues": "Críticos",
    "dash.complianceScore": "Puntuación",
    "dash.recentScan": "Resultados Recientes",
    "dash.noScans": "Sin escaneos. Ejecuta tu primer escaneo.",
    "dash.startScan": "Nuevo Escaneo",

    "scan.title": "Escaneo de Cumplimiento",
    "scan.subtitle": "Selecciona regiones y comienza a escanear",
    "scan.selectRegions": "Regiones Objetivo",
    "scan.startScan": "Iniciar Escaneo",
    "scan.scanning": "Escaneando...",
    "scan.results": "Resultados",
    "scan.score": "Puntuación",
    "scan.issues": "Problemas",
    "scan.noIssues": "¡Sin problemas!",
    "scan.generateFixes": "Generar Correcciones",
    "scan.generateAllFixes": "Generar Todas las Correcciones",
    "scan.exportCSV": "Exportar CSV",
    "scan.exportPDF": "Exportar PDF",

    "fix.title": "Corrección Generada",
    "fix.copyToClipboard": "Copiar",
    "fix.copied": "¡Copiado!",
    "fix.applyFix": "Aplicar",
    "fix.language": "Idioma",

    "connect.title": "Conecta Tu Tienda",
    "connect.subtitle": "Vincula tu tienda Shopify o sube un archivo CSV",
    "connect.shopify": "Conectar Shopify",
    "connect.shopifyDesc": "OAuth para escanear tu tienda",
    "connect.csv": "Subir CSV",
    "connect.csvDesc": "Sube tu exportación CSV de Etsy",
    "connect.dragDrop": "Arrastra tu CSV aquí o haz clic para buscar",
    "connect.sampleCSV": "Descargar CSV de Ejemplo",
    "connect.connected": "Tienda Conectada",
    "connect.processing": "Procesando...",

    "settings.title": "Configuración",
    "settings.regions": "Regiones Predeterminadas",
    "settings.notifications": "Notificaciones",
    "settings.email": "Alertas por Email",
    "settings.slack": "Webhook de Slack",
    "settings.language": "Idioma",
    "settings.theme": "Tema",
    "settings.darkMode": "Modo Oscuro",
    "settings.account": "Cuenta",
    "settings.plan": "Plan Actual",
    "settings.delete": "Eliminar Cuenta",

    "pricing.title": "Precios Simples y Justos",
    "pricing.subtitle": "Para vendedores que no pueden pagar herramientas empresariales",
    "pricing.monthly": "Mensual",
    "pricing.lifetime": "De por vida",
    "pricing.free": "Gratis",
    "pricing.freeDesc": "Prueba antes de comprar",
    "pricing.freeFeature1": "5 productos por escaneo",
    "pricing.freeFeature2": "Verificaciones básicas",
    "pricing.freeFeature3": "1 región",
    "pricing.pro": "Pro",
    "pricing.proPrice": "$15",
    "pricing.proDesc": "Todo lo que necesitas",
    "pricing.proFeature1": "Productos ilimitados",
    "pricing.proFeature2": "Análisis AI profundo",
    "pricing.proFeature3": "Todas las regiones",
    "pricing.proFeature4": "Alertas semanales",
    "pricing.proFeature5": "Generador de correcciones",
    "pricing.lifetimePrice": "$149",
    "pricing.lifetimeDesc": "Paga una vez, escanea siempre",
    "pricing.cta": "Comenzar",
    "pricing.ctaFree": "Escanear Gratis",

    "auth.login": "Iniciar Sesión",
    "auth.signup": "Crear Cuenta",
    "auth.email": "Email",
    "auth.password": "Contraseña",
    "auth.magicLink": "Enviar Enlace Mágico",
    "auth.google": "Continuar con Google",
    "auth.guest": "Probar como Invitado",
    "auth.checkEmail": "¡Revisa tu email para el enlace!",

    "hero.title": "Nunca más multas ni deslistados",
    "hero.subtitle": "La IA escanea tu tienda Shopify/Etsy para GDPR, GPSR, Prop 65 y reglas aduaneras 2026 — en 60 segundos.",
    "hero.cta": "Escanear Mi Tienda Gratis",
    "hero.ctaSub": "Sin tarjeta de crédito",

    "common.loading": "Cargando...",
    "common.error": "Algo salió mal",
    "common.retry": "Reintentar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.close": "Cerrar",
    "common.back": "Atrás",
    "common.next": "Siguiente",
    "common.critical": "Crítico",
    "common.warning": "Advertencia",
    "common.info": "Info",
    "common.passed": "Aprobado",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const t = useCallback(
    (key: string): string => {
      const value = translations[locale]?.[key];
      if (typeof value === "string") return value;
      return key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
