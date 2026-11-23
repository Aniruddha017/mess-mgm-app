import CryptoES from 'crypto-es';
import { CONFIG } from '../constants/config';

export interface DecodedQRPayload {
  b_id: number;
  s_id: string;
  slot_id: number;
  exp: number;
  iat: number;
}

/**
 * Base64 URL decode helper
 */
function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw new Error('Illegal base64url string');
  }
  return decodeURIComponent(
    atob(output)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Parses and verifies HMAC signed QR token client-side
 */
export function decodeAndVerifyQRToken(token: string): { isValid: boolean; payload?: DecodedQRPayload; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { isValid: false, error: 'Malformed QR token structure' };
    }

    const [payloadB64, sigB64] = parts;

    // Verify HMAC-SHA256 signature
    const expectedSig = CryptoES.HmacSHA256(payloadB64, CONFIG.QR_HMAC_SECRET);
    const expectedSigB64 = CryptoES.enc.Base64.stringify(expectedSig)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (sigB64 !== expectedSigB64) {
      return { isValid: false, error: 'Invalid QR signature: forged or corrupted code' };
    }

    // Decode JSON payload
    const decodedJson = base64UrlDecode(payloadB64);
    const payload: DecodedQRPayload = JSON.parse(decodedJson);

    // Check expiration timestamp
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { isValid: false, payload, error: 'QR Code expired. Ask student to refresh the screen.' };
    }

    return { isValid: true, payload };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Failed to decode QR token' };
  }
}

