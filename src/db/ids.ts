/**
 * UUIDv7 (RFC 9562): a 48-bit Unix millisecond timestamp followed by random bits. IDs sort by
 * creation time, so primary-key inserts land at the end of the B-tree instead of scattering
 * across it the way random v4 IDs do. Generated in the app so it works on any Postgres version;
 * the column default (`gen_random_uuid()`) only covers rows inserted by hand in SQL.
 */
export function uuidv7(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const ms = Date.now();
  b[0] = Math.floor(ms / 2 ** 40) & 0xff;
  b[1] = Math.floor(ms / 2 ** 32) & 0xff;
  b[2] = (ms >>> 24) & 0xff;
  b[3] = (ms >>> 16) & 0xff;
  b[4] = (ms >>> 8) & 0xff;
  b[5] = ms & 0xff;
  b[6] = (b[6]! & 0x0f) | 0x70; // version 7
  b[8] = (b[8]! & 0x3f) | 0x80; // RFC 9562 variant
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
