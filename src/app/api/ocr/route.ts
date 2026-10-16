import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Product } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash", "gemini-flash-latest"];

async function runMultimodalExtraction(parts: any[]): Promise<string> {
  let lastError: any = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      console.warn(`OCR model ${modelName} failed, falling back to next...`, err.message);
    }
  }
  throw lastError || new Error("All Gemini vision models failed");
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let base64Data = "";
    let mimeType = "";
    let fileName = "document";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }
      fileName = file.name;
      mimeType = file.type || "application/octet-stream";
      const buffer = Buffer.from(await file.arrayBuffer());
      base64Data = buffer.toString("base64");
    } else {
      const json = await request.json();
      base64Data = json.base64;
      mimeType = json.mimeType;
      fileName = json.fileName || "document";
    }

    if (!base64Data || !mimeType) {
      return NextResponse.json(
        { error: "Missing required file data or mimeType" },
        { status: 400 }
      );
    }

    // Supported types for Gemini Vision / Multimodal
    const supportedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf"
    ];

    if (!supportedTypes.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported file format (${mimeType}). Supported: PDF, PNG, JPG, WEBP.` },
        { status: 400 }
      );
    }

    const ocrPrompt = `You are a forensic document and handwriting OCR engine specialized in international e-commerce compliance (EU GPSR, Prop 65, Customs tariffs).
Analyze the attached document, product label photo, laboratory certificate, or handwritten note with extreme precision. 
Carefully transcribe every word, printed fine print, stamped lot number, handwritten specification, safety hazard, and material note.

Extract all distinct commercial products mentioned into structured data.

Return ONLY a valid JSON object matching this schema:
{
  "document_type": "handwritten_note" | "packaging_label" | "invoice" | "safety_spec_sheet" | "certificate",
  "confidence_rating": "high" | "medium" | "low",
  "raw_transcription": "Verbatim transcription of all text detected in the image/document",
  "products": [
    {
      "title": "Accurate product name",
      "description": "Comprehensive description including materials, dimensions, usage, and safety warnings",
      "price": 25.0,
      "currency": "EUR",
      "tags": ["material1", "category", "warning"],
      "sku": "SKU or Batch number if visible",
      "manufacturer": "Company or maker name if visible",
      "countryOfOrigin": "Country where made/origin if stated",
      "hasCeMark": true or false,
      "prop65WarningStated": true or false,
      "responsiblePersonStated": true or false
    }
  ]
}`;

    const parts = [
      ocrPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType === "image/jpg" ? "image/jpeg" : mimeType,
        },
      },
    ];

    const rawOutput = await runMultimodalExtraction(parts);
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to extract structured product data from document");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Map extracted items into List Guard Product domain
    const products: Product[] = (parsedData.products || []).map((p: any, idx: number) => ({
      id: `ocr-${Date.now()}-${idx}`,
      title: p.title || `Extracted Item #${idx + 1}`,
      description: p.description || parsedData.raw_transcription?.slice(0, 300) || "Extracted from document",
      tags: Array.isArray(p.tags) ? p.tags : ["ocr-imported"],
      price: Number(p.price) || 29,
      currency: p.currency || "EUR",
      images: [],
      variants: p.sku ? [{ id: `var-${idx}`, title: "Default", sku: p.sku, price: Number(p.price) || 29 }] : [],
      platform: "csv",
    }));

    return NextResponse.json({
      success: true,
      fileName,
      documentType: parsedData.document_type || "spec_sheet",
      confidence: parsedData.confidence_rating || "high",
      rawTranscription: parsedData.raw_transcription,
      productsCount: products.length,
      products,
    });
  } catch (error: any) {
    console.error("OCR Ingestion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
