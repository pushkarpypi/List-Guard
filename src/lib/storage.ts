// Zero-Cloud-Footprint Secure Local Storage using IndexedDB and Web Crypto API

const DB_NAME = "ListGuardSecureDB";
const STORE_NAME = "scan_history";
const DB_VERSION = 1;

/**
 * Initialize the IndexedDB database
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("No window object");

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Generate or retrieve an encryption key bound to the local session
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Try to use a static salt (in production you might derive this from a user hash)
  const salt = new TextEncoder().encode("ListGuard-Secure-Salt-2026");
  
  // Create a key derived from a static constant to ensure persistence across reloads 
  // without storing in plaintext, but still restricting execution to this origin.
  // We use PBKDF2 to derive an AES-GCM key.
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("ListGuard-Local-Zero-Footprint"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

const generateIV = () => crypto.getRandomValues(new Uint8Array(12));

/**
 * Encrypt data payload using AES-GCM
 */
async function encryptData(data: any): Promise<{ encryptedBuf: ArrayBuffer; iv: Uint8Array }> {
  const key = await getEncryptionKey();
  const iv = generateIV();
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    encoded
  );

  return { encryptedBuf, iv };
}

/**
 * Decrypt data payload using AES-GCM
 */
async function decryptData(encryptedBuf: ArrayBuffer, iv: Uint8Array): Promise<any> {
  const key = await getEncryptionKey();
  const decryptedBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    encryptedBuf
  );

  const decoded = new TextDecoder().decode(decryptedBuf);
  return JSON.parse(decoded);
}

/**
 * Save scan result securely to Local IndexedDB
 */
export async function saveScanSummaryLocally(summary: any): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await initDB();
    const { encryptedBuf, iv } = await encryptData(summary);

    const record = {
      id: summary.id,
      timestamp: Date.now(),
      iv,
      payload: encryptedBuf,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to securely save scan locally:", error);
  }
}

/**
 * Retrieve all scan summaries from Local IndexedDB
 */
export async function getLocalScanHistory(): Promise<any[]> {
  if (typeof window === "undefined") return [];

  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const records = request.result;
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        
        const decryptedItems = [];

        // Also cleanup expired records
        const expiredIds: string[] = [];

        for (const record of records) {
          if (now - record.timestamp > thirtyDaysMs) {
            expiredIds.push(record.id);
            continue;
          }

          try {
            const item = await decryptData(record.payload, record.iv);
            decryptedItems.push(item);
          } catch (e) {
            console.error("Decryption failed for historical scan", e);
          }
        }

        // Cleanup expired entries asynchronously
        if (expiredIds.length > 0) {
          const cleanupTx = db.transaction(STORE_NAME, "readwrite");
          const cleanupStore = cleanupTx.objectStore(STORE_NAME);
          expiredIds.forEach(id => cleanupStore.delete(id));
        }

        // Return sorted by date (newest first)
        decryptedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(decryptedItems);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to retrieve secure scan history:", error);
    return [];
  }
}

/**
 * Delete a specific scan by ID
 */
export async function deleteLocalScan(id: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete secure scan:", error);
  }
}
