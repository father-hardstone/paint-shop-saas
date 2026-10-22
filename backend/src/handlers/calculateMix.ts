import { Request, Response } from 'express';
import { dbManager } from '../db/db.js';

export async function handleCalculateMix(req: Request, res: Response) {
  try {
    const { colors, volumeLitres } = req.body as {
      colors: { colorId: string; percentage: number }[];
      volumeLitres: number;
    };

    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      res.status(400).json({ error: 'Colors array is required' });
      return;
    }

    if (!volumeLitres || volumeLitres <= 0) {
      res.status(400).json({ error: 'Volume in litres must be greater than zero' });
      return;
    }

    // Verify percentages sum to 100
    const totalPercentage = colors.reduce((sum, c) => sum + c.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      res.status(400).json({ error: 'Total color share must equal 100%' });
      return;
    }

    const paints = await dbManager.getPaints();
    let totalCost = 0;
    const details = [];
    const stockIssues = [];

    for (const item of colors) {
      const paint = paints.find(p => p.id === item.colorId);
      if (!paint) {
        res.status(400).json({ error: `Paint color with ID "${item.colorId}" not found` });
        return;
      }

      const neededVolume = (item.percentage / 100) * volumeLitres;
      const itemCost = neededVolume * paint.pricePerLitre;
      totalCost += itemCost;

      if (paint.quantityLitres < neededVolume) {
        stockIssues.push({
          colorId: paint.id,
          name: paint.name,
          available: paint.quantityLitres,
          needed: neededVolume,
        });
      }

      details.push({
        colorId: paint.id,
        name: paint.name,
        hex: paint.hex,
        percentage: item.percentage,
        volume: neededVolume,
        cost: itemCost,
      });
    }

    res.json({
      valid: stockIssues.length === 0,
      totalCost: Number(totalCost.toFixed(2)),
      details,
      stockIssues,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate mix' });
  }
}
