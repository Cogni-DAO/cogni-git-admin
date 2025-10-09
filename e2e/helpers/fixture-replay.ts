import fs from 'fs';
import http from 'http';
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
  
  const opts: http.RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + (url.search || ''),
    method: rec.method || 'POST',
    headers: { ...rec.headers, 'content-length': body.length },
    timeout: 10000 // 10 second timeout
  };
  
  const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
    const req = http.request(opts, (response) => {
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