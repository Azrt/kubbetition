import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';

@Injectable()
export class GeolocationService {
  /**
   * Get country code from IP address
   * @param ip - IP address (IPv4 or IPv6)
   * @returns ISO 3166-1 alpha-2 country code (e.g., "US", "GB") or null if not found
   */
  getCountryFromIp(ip: string): string | null {
    if (!ip) {
      return null;
    }

    // Handle localhost and private IPs
    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    ) {
      return null;
    }

    // Remove IPv6 prefix if present (e.g., "::ffff:192.0.2.1" -> "192.0.2.1")
    const cleanedIp = ip.replace(/^::ffff:/, '');

    try {
      const geo = geoip.lookup(cleanedIp);
      return geo?.country || null;
    } catch (error) {
      console.error('Error looking up IP geolocation:', error);
      return null;
    }
  }

  /**
   * Extract IP address from request
   * Considers X-Forwarded-For header for proxied requests
   */
  getIpFromRequest(request: any): string | null {
    // Check X-Forwarded-For header (for requests behind proxies/load balancers)
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ips = xForwardedFor.split(',');
      return ips[0].trim();
    }

    // Check X-Real-IP header
    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) {
      return xRealIp;
    }

    // Fall back to connection remote address
    return request.ip || request.connection?.remoteAddress || null;
  }
}
