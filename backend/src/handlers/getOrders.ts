import { Response } from 'express';
import { dbManager } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function handleGetOrders(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const orders = await dbManager.getOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
}
