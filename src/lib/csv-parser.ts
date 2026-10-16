import Papa from "papaparse";
import type { Product } from "./types";

interface CSVRow {
  [key: string]: string;
}

/**
 * Parse a CSV file (Etsy export format or generic) into Product objects
 */
export function parseCSVToProducts(csvText: string): Product[] {
  const result = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (result.errors.length > 0) {
    console.warn("CSV parsing warnings:", result.errors);
  }

  return result.data
    .map((row, index) => mapRowToProduct(row, index))
    .filter((p): p is Product => p !== null);
}

function mapRowToProduct(row: CSVRow, index: number): Product | null {
  // Try multiple column name formats (Etsy, Shopify, generic)
  const title =
    row["title"] ||
    row["product_title"] ||
    row["name"] ||
    row["listing_title"] ||
    row["item_name"];

  if (!title) return null;

  const description =
    row["description"] ||
    row["product_description"] ||
    row["body_(html)"] ||
    row["body_html"] ||
    "";

  const tags =
    (row["tags"] || row["product_tags"] || row["keyword"] || "")
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);

  const price = parseFloat(
    row["price"] || row["variant_price"] || row["retail_price"] || "0"
  );

  const currency =
    row["currency"] || row["currency_code"] || "USD";

  const sku = row["sku"] || row["variant_sku"] || row["item_sku"] || "";

  const images = (row["image_url"] || row["image1"] || row["image_src"] || "")
    .split(",")
    .map((u: string) => u.trim())
    .filter(Boolean);

  return {
    id: `csv-${index}-${Date.now()}`,
    externalId: row["id"] || row["listing_id"] || row["product_id"] || undefined,
    title,
    description,
    tags,
    price: isNaN(price) ? 0 : price,
    currency,
    images,
    variants: [
      {
        id: `var-${index}`,
        title: row["variant_title"] || "Default",
        sku: sku || undefined,
        price: isNaN(price) ? 0 : price,
        weight: parseFloat(row["weight"] || "0") || undefined,
        weightUnit: row["weight_unit"] || undefined,
      },
    ],
    shippingProfile: {
      destinations: (row["shipping_destinations"] || row["ships_to"] || "")
        .split(",")
        .map((d: string) => d.trim())
        .filter(Boolean),
      freeShipping: row["free_shipping"]?.toLowerCase() === "true" || row["free_shipping"] === "yes",
    },
    platform: "csv",
  };
}

/**
 * Generate a sample CSV for testing
 */
export function generateSampleCSV(): string {
  const headers = [
    "title",
    "description",
    "tags",
    "price",
    "currency",
    "sku",
    "image_url",
    "shipping_destinations",
  ];

  const rows = [
    [
      "Handmade Silver Ring with Crystal",
      "Beautiful silver ring with natural crystal. Contains lead-free materials.",
      "jewelry,silver,ring,handmade,crystal",
      "29.99",
      "USD",
      "SR-001",
      "",
      "US,EU,UK,CA",
    ],
    [
      "Organic Cotton Baby Blanket",
      "100% organic cotton baby blanket. Machine washable. Safe for newborns.",
      "baby,blanket,organic,cotton,nursery",
      "45.00",
      "USD",
      "",
      "",
      "US,EU,UK",
    ],
    [
      "Vintage Brass Candle Holder with Lead Finish",
      "Antique-style brass candle holder with decorative lead detailing. May contain cadmium in paint.",
      "vintage,brass,candle,home decor,antique",
      "35.00",
      "USD",
      "BCH-003",
      "",
      "US,EU,CA",
    ],
    [
      "Custom Pocket Knife - Carbon Steel",
      "Handcrafted pocket knife with carbon steel blade. Sharp edge. 4-inch blade.",
      "knife,custom,carbon steel,edc,handmade",
      "89.99",
      "USD",
      "PK-004",
      "",
      "US,UK",
    ],
    [
      "Natural Beeswax Candles Set",
      "Set of 6 natural beeswax candles. Clean burning. No synthetic fragrances.",
      "candles,beeswax,natural,home,gifts",
      "24.99",
      "USD",
      "BWC-005",
      "",
      "US,EU,UK,CA,IN",
    ],
    [
      "Ceramic Coffee Mug - Artisan Glazed",
      "Handthrown ceramic mug with food-safe glaze. Dishwasher safe. 12oz capacity.",
      "ceramic,mug,coffee,handmade,pottery",
      "18.50",
      "EUR",
      "",
      "",
      "EU,UK,US",
    ],
    [
      "Kids Wooden Toy Train Set",
      "Colorful wooden train set for children ages 3+. Non-toxic paint. Small parts choking hazard.",
      "toys,wooden,train,kids,children,educational",
      "42.00",
      "USD",
      "WTS-007",
      "",
      "US,EU,UK,CA",
    ],
    [
      "Scented Soy Candle with Essential Oils",
      "Aromatherapy soy candle with lavender essential oil. Contains toluene-free fragrance.",
      "candle,soy,aromatherapy,lavender,relaxation",
      "15.99",
      "USD",
      "SSC-008",
      "",
      "GLOBAL",
    ],
  ];

  return [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
}
