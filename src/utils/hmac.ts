import express, { Request } from 'express';
import crypto from 'crypto';

export interface RequestWithRawBody extends Request {
  rawBody: Buffer;
}

export function rawJson() {
  return express.json({ 
    limit: '1mb', 
    verify: (req: Request, _res, buf) => { 
      (req as RequestWithRawBody).rawBody = buf; 
    } 
  });
}

export function verifyAlchemyHmac(req: RequestWithRawBody) {
  const key = process.env.ALCHEMY_SIGNING_KEY; 
  if (!key) return true;
  
  const sig = req.get('X-Alchemy-Signature') || '';
  const mac = crypto.createHmac('sha256', key).update(req.rawBody).digest('hex');
  
  try { 
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(mac, 'hex')); 
  } catch { 
    return false; 
  }
}