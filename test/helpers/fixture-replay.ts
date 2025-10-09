import fs from 'fs';
import http from 'http';
import { once } from 'events';

export type Recorded = {
  headers: Record<string, string | string[]>;
  body_raw_base64: string;
  method: string;
  url: string;
};

export async function replayFixture(fixturePath: string, targetUrl: string) {
  const rec = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Recorded;
  const body = Buffer.from(rec.body_raw_base64, 'base64');
  const url = new URL(targetUrl);
  const opts: http.RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + (url.search || ''),
    method: rec.method || 'POST',
    headers: { ...rec.headers, 'content-length': body.length }
  };
  const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
    const req = http.request(opts, resolve);
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  await once(res, 'end').catch(() => {});
  return res.statusCode || 0;
}