import fs from 'fs';
import http from 'http';
import https from 'https';
import { once } from 'events';
import { URL } from 'url';

export type Recorded = {
  headers: Record<string, string | string[]>;
  body_raw_base64: string;
  method: string;
  url: string;
};

export async function replayFixture(fixturePath: string, targetUrl: string) {
  console.log(`[replay] Reading fixture: ${fixturePath}`);
  const rec = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Recorded;
  const body = Buffer.from(rec.body_raw_base64, 'base64');
  const url = new URL(targetUrl);
  
  console.log(`[replay] Sending ${rec.method} to ${targetUrl} with ${body.length} bytes`);
  
  // Clean headers: remove proxy artifacts that poison SNI/ALPN negotiation
  const cleanHeaders: Record<string, string | number> = {
    'content-type': (rec.headers['content-type'] as string) || 'application/json',
    'content-length': body.length,
    'user-agent': 'cogni-e2e/1.0'
  };
  
  // Preserve auth headers if present (but not proxy cookies/keys)
  const authHeaders = ['authorization', 'x-hub-signature-256', 'x-alchemy-signature'];
  authHeaders.forEach(header => {
    if (rec.headers[header]) {
      cleanHeaders[header] = rec.headers[header] as string;
    }
  });
  
  const opts: https.RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + (url.search || ''),
    method: rec.method || 'POST',
    headers: cleanHeaders,
    timeout: 10000,
    servername: url.hostname, // explicit SNI
    family: 4, // force IPv4 to avoid v6 path quirks  
    minVersion: 'TLSv1.2'
  };
  
  const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(opts, (response) => {
      console.log(`[replay] Response: ${response.statusCode}`);
      resolve(response);
    });
    
    req.on('error', (error) => {
      console.error(`[replay] Request error:`, error);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error(`[replay] Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(body);
    req.end();
  });
  
  // Consume response body to avoid hanging
  res.resume();
  await once(res, 'end').catch(() => {});
  return res.statusCode || 0;
}