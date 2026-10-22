import { Response } from 'express';
import { dbManager } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function handleCreateOrder(req: AuthRequest, res: Response) {
  try {
    const { customerName, customerEmail, customerPhone, mixName, colors, volumeLitres, totalCost } = req.body as {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      mixName: string;
      colors: { colorId: string; name: string; hex: string; percentage: number }[];
      volumeLitres: number;
      totalCost: number;
    };

    if (!customerName || !customerEmail || !mixName || !colors || !volumeLitres || !totalCost) {
      res.status(400).json({ error: 'Missing required order fields.' });
      return;
    }

    // Verify stock one more time
    const paints = await dbManager.getPaints();
    for (const color of colors) {
      const paint = paints.find(p => p.id === color.colorId);
      if (!paint) {
        res.status(400).json({ error: `Color ${color.name} not found.` });
        return;
      }
      const neededVolume = (color.percentage / 100) * volumeLitres;
      if (paint.quantityLitres < neededVolume) {
        res.status(400).json({ 
          error: `Insufficient stock for ${paint.name}. Available: ${paint.quantityLitres.toFixed(1)}L, needed: ${neededVolume.toFixed(1)}L.` 
        });
        return;
      }
    }

    const order = await dbManager.createOrder({
      userId: req.user?.id,
      customerName,
      customerEmail,
      customerPhone,
      mixName,
      colors,
      volumeLitres,
      totalCost,
    });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to place order.' });
  }
}
