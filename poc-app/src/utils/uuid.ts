// UUID v4 fallback for environments without crypto.randomUUID (e.g., some older browsers)
export const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback using getRandomValues if available
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Version 4 UUID
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    const segments = [
      [...bytes.slice(0, 4)].map(toHex).join(""),
      [...bytes.slice(4, 6)].map(toHex).join(""),
      [...bytes.slice(6, 8)].map(toHex).join(""),
      [...bytes.slice(8, 10)].map(toHex).join(""),
      [...bytes.slice(10, 16)].map(toHex).join(""),
    ];
    return segments.join("-");
  }

  // Last resort: timestamp + random
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
