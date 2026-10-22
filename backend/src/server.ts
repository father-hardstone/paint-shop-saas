import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbManager } from './db/db.js';
import { handleGetPaints } from './handlers/getPaints.js';
import { handleGetOrders } from './handlers/getOrders.js';
import { handleCalculateMix } from './handlers/calculateMix.js';
import { handleCreateOrder } from './handlers/createOrder.js';
import { 
  handleSignUp, 
  handleSignIn, 
  handleGetMe, 
  handleUpdateSettings,
  handleGetInventory,
  handleAddInventoryItem,
  handleGetInvoices,
  handleCreateInvoice
} from './handlers/auth.js';
import { authMiddleware } from './middleware/auth.js';
import { storageService } from './services/storage.js';

import dns from 'node:dns';

dotenv.config();

// Force MongoDB Atlas SRV/TXT lookups through known public DNS servers (8.8.8.8, 8.8.4.4).
// Must run before any MongoDB connection or DNS lookup initiates.
dns.setServers(['8.8.8.8', '8.8.4.4']);
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS whitelist from environment
const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawFrontendUrls.split(',').map(url => url.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser requests (e.g. mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origins or localhost in development
    const isAllowed = allowedOrigins.includes(origin) || 
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json({ limit: '10mb' }));

// R2 Image Proxy: serves images from Cloudflare R2 when no public URL is configured.
// Route: /api/storage/:userUuid/:filename
app.get('/api/storage/:userUuid/:filename', async (req, res) => {
  try {
    const { userUuid, filename } = req.params;
    const r2Key = `paint-shop/${userUuid}/${filename}`;

    const result = await storageService.getObject(r2Key);
    if (!result || !result.body) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    result.body.transformToByteArray().then((bytes: Uint8Array) => {
      res.send(Buffer.from(bytes));
    }).catch((err: any) => {
      console.error('Error streaming R2 object:', err);
      res.status(500).json({ error: 'Failed to stream image.' });
    });
  } catch (err) {
    console.error('R2 proxy error:', err);
    res.status(500).json({ error: 'Failed to retrieve image.' });
  }
});

// Public Auth Endpoints
app.post('/api/auth/signup', handleSignUp);
app.post('/api/auth/signin', handleSignIn);

// Public Endpoints
app.get('/api/paints', handleGetPaints);
app.post('/api/calculate-mix', handleCalculateMix);

// Protected Endpoints (Access token required)
app.get('/api/auth/me', authMiddleware, handleGetMe);
app.put('/api/auth/settings', authMiddleware, handleUpdateSettings);
app.get('/api/orders', authMiddleware, handleGetOrders);
app.post('/api/orders', authMiddleware, handleCreateOrder);

// Dashboard Tabs Endpoints: Inventory & Billing
app.get('/api/inventory', authMiddleware, handleGetInventory);
app.post('/api/inventory', authMiddleware, handleAddInventoryItem);
app.get('/api/billing/invoices', authMiddleware, handleGetInvoices);
app.post('/api/billing/invoices', authMiddleware, handleCreateInvoice);

// Initialization and start-up
async function startServer() {
  await dbManager.init();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
