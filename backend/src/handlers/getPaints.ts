import { Request, Response } from 'express';
import { dbManager } from '../db/db.js';

export async function handleGetPaints(req: Request, res: Response) {
  try {
    const paints = await dbManager.getPaints();
    res.json(paints);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch paints' });
  }
}
