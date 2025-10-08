import express from 'express';
import crypto from 'crypto';

export function rawJson() {
  return express.json({ 
    limit: '1mb', 
    verify: (req: any, _res, buf) => { 
      req.rawBody = buf; 
    } 
  });
}

export function verifyAlchemyHmac(req: any) {
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