import { MongoClient, Db } from 'mongodb';
import { randomUUID } from 'crypto';
import dns from 'node:dns';
import dotenv from 'dotenv';

dotenv.config();

// Force MongoDB Atlas SRV/TXT lookups through known public DNS servers (8.8.8.8, 8.8.4.4).
dns.setServers(['8.8.8.8', '8.8.4.4']);
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// User profile type
export interface User {
  id: string; // User UUID e.g. "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  uuid: string; // Explicit UUID field matching id
  serialNumber: number; // Incrementing integer e.g. 1001, 1002
  primaryType: 'phone' | 'email';
  primaryCommunication: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  name?: string;
  shopName?: string;
  shopAddress?: string;
  alternativeCommunication?: string;
  profilePicture?: string;
  companyLogo?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  userId?: string;
  name: string;
  category: 'paint' | 'utility' | 'accessory';
  sku?: string;
  hex?: string;
  unit: 'litres' | 'pieces' | 'cans' | 'rolls' | 'kg';
  quantity: number;
  unitPrice: number;
  minAlertThreshold?: number;
  updatedAt: string;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  userId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'draft';
  paymentMethod: 'cash' | 'card' | 'online' | 'credit';
  createdAt: string;
}

export interface PaintItem {
  id: string;
  name: string;
  hex: string;
  quantityLitres: number;
  pricePerLitre: number;
}

export interface PaintColorShare {
  colorId: string;
  name: string;
  hex: string;
  percentage: number;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  mixName: string;
  colors: PaintColorShare[];
  volumeLitres: number;
  totalCost: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

// Initial seed data
const initialPaints: PaintItem[] = [
  { id: 'red', name: 'Crimson Red', hex: '#DC2626', quantityLitres: 120, pricePerLitre: 15.5 },
  { id: 'blue', name: 'Royal Blue', hex: '#2563EB', quantityLitres: 95, pricePerLitre: 14.8 },
  { id: 'yellow', name: 'Lemon Yellow', hex: '#FBBF24', quantityLitres: 80, pricePerLitre: 16.2 },
  { id: 'white', name: 'Titanium White', hex: '#FFFFFF', quantityLitres: 350, pricePerLitre: 10.0 },
  { id: 'black', name: 'Carbon Black', hex: '#111827', quantityLitres: 150, pricePerLitre: 12.0 },
  { id: 'green', name: 'Forest Green', hex: '#15803D', quantityLitres: 75, pricePerLitre: 15.0 },
];

const initialInventory: InventoryItem[] = [
  { id: 'inv_1', name: 'Crimson Red Base Pigment', category: 'paint', unit: 'litres', quantity: 120, unitPrice: 15.5, hex: '#DC2626', updatedAt: new Date().toISOString() },
  { id: 'inv_2', name: 'Royal Blue Base Pigment', category: 'paint', unit: 'litres', quantity: 95, unitPrice: 14.8, hex: '#2563EB', updatedAt: new Date().toISOString() },
  { id: 'inv_3', name: 'Lemon Yellow Base Pigment', category: 'paint', unit: 'litres', quantity: 80, unitPrice: 16.2, hex: '#FBBF24', updatedAt: new Date().toISOString() },
  { id: 'inv_4', name: 'Titanium White Base Pigment', category: 'paint', unit: 'litres', quantity: 350, unitPrice: 10.0, hex: '#FFFFFF', updatedAt: new Date().toISOString() },
  { id: 'inv_5', name: 'Enamel Thinner (5L)', category: 'utility', unit: 'cans', quantity: 45, unitPrice: 18.0, updatedAt: new Date().toISOString() },
  { id: 'inv_6', name: 'Synthetic Paint Brush (3")', category: 'accessory', unit: 'pieces', quantity: 60, unitPrice: 4.5, updatedAt: new Date().toISOString() },
  { id: 'inv_7', name: 'Heavy-Duty Paint Roller', category: 'accessory', unit: 'pieces', quantity: 30, unitPrice: 8.0, updatedAt: new Date().toISOString() },
  { id: 'inv_8', name: 'Crepe Masking Tape (2")', category: 'utility', unit: 'rolls', quantity: 85, unitPrice: 2.5, updatedAt: new Date().toISOString() },
  { id: 'inv_9', name: 'Epoxy Wall Primer', category: 'paint', unit: 'cans', quantity: 25, unitPrice: 32.0, updatedAt: new Date().toISOString() },
];

class DatabaseManager {
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;

  async init() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required. No local JSON fallback is available.');
    }

    console.log('Attempting to connect to MongoDB...');
    this.mongoClient = new MongoClient(mongoUri);
    await this.mongoClient.connect();
    this.db = this.mongoClient.db();
    console.log('Successfully connected to MongoDB.');

    // Seed MongoDB if empty
    const paintCount = await this.db.collection('paints').countDocuments();
    if (paintCount === 0) {
      await this.db.collection('paints').insertMany(initialPaints);
      console.log('Seeded initial paints to MongoDB.');
    }

    const invCount = await this.db.collection('inventory').countDocuments();
    if (invCount === 0) {
      await this.db.collection('inventory').insertMany(initialInventory);
      console.log('Seeded initial inventory to MongoDB.');
    }
  }

  private getDb(): Db {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Next serial number generator for shops/users
  async getNextSerialNumber(): Promise<number> {
    const db = this.getDb();
    const highestUser = await db.collection<User>('paint-shop')
      .find({})
      .sort({ serialNumber: -1 })
      .limit(1)
      .toArray();
    if (highestUser.length > 0 && highestUser[0].serialNumber) {
      return highestUser[0].serialNumber + 1;
    }
    return 1001;
  }

  // User Operations - Stored in collection: paint-shop
  async findUserByEmailOrPhone(identifier: string): Promise<User | null> {
    const db = this.getDb();
    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    const user = await db.collection<User>('paint-shop').findOne({
      $or: [
        { primaryCommunication: cleanId },
        { primaryCommunication: cleanDigits },
        { email: cleanId },
        { phone: cleanId },
        { phone: cleanDigits }
      ]
    });
    if (user) {
      const { _id, ...rest } = user as any;
      return rest;
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    const db = this.getDb();
    const user = await db.collection<User>('paint-shop').findOne({
      $or: [{ id }, { uuid: id }]
    });
    if (user) {
      const { _id, ...rest } = user as any;
      return rest;
    }
    return null;
  }

  async createUser(userData: Omit<User, 'id' | 'uuid' | 'createdAt' | 'serialNumber'>): Promise<User> {
    const db = this.getDb();
    const serialNumber = await this.getNextSerialNumber();
    const userUuid = randomUUID(); // Standard cryptographic UUID

    const newUser: User = {
      ...userData,
      serialNumber,
      id: userUuid,
      uuid: userUuid,
      createdAt: new Date().toISOString(),
    };

    await db.collection('paint-shop').insertOne(newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const db = this.getDb();
    delete (updates as any).primaryCommunication;
    delete (updates as any).primaryType;
    delete (updates as any).serialNumber;
    delete (updates as any).id;
    delete (updates as any).uuid;

    await db.collection('paint-shop').updateOne(
      { $or: [{ id }, { uuid: id }] },
      { $set: updates }
    );
    return this.findUserById(id);
  }

  // Inventory Operations
  async getInventory(userId?: string): Promise<InventoryItem[]> {
    const db = this.getDb();
    const query = userId ? { $or: [{ userId }, { userId: { $exists: false } }] } : {};
    const items = await db.collection<InventoryItem>('inventory').find(query).toArray();
    return items.map(({ _id, ...rest }: any) => rest);
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'updatedAt'>): Promise<InventoryItem> {
    const db = this.getDb();
    const newItem: InventoryItem = {
      ...item,
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('inventory').insertOne(newItem);
    return newItem;
  }

  // Billing Operations
  async getInvoices(userId?: string): Promise<BillingInvoice[]> {
    const db = this.getDb();
    const query = userId ? { userId } : {};
    const invoices = await db.collection<BillingInvoice>('invoices')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    return invoices.map(({ _id, ...rest }: any) => rest);
  }

  async createInvoice(invoice: Omit<BillingInvoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<BillingInvoice> {
    const db = this.getDb();
    const count = await db.collection('invoices').countDocuments();

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const newInvoice: BillingInvoice = {
      ...invoice,
      id: 'invc_' + Math.random().toString(36).substr(2, 9),
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    await db.collection('invoices').insertOne(newInvoice);
    return newInvoice;
  }

  // Paint stock API operations
  async getPaints(): Promise<PaintItem[]> {
    const db = this.getDb();
    const paints = await db.collection<PaintItem>('paints').find({}).toArray();
    return paints.map(({ _id, ...rest }: any) => rest);
  }

  async updatePaintStock(id: string, reductionLitres: number): Promise<boolean> {
    const db = this.getDb();
    const result = await db.collection('paints').updateOne(
      { id },
      { $inc: { quantityLitres: -reductionLitres } }
    );
    return result.modifiedCount > 0;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    const db = this.getDb();
    const query = userId ? { userId } : {};
    const orders = await db.collection<Order>('orders').find(query).sort({ createdAt: -1 }).toArray();
    return orders.map(({ _id, ...rest }: any) => rest);
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    const db = this.getDb();
    const newOrder: Order = {
      ...order,
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    for (const color of order.colors) {
      const volumeUsed = (color.percentage / 100) * order.volumeLitres;
      await this.updatePaintStock(color.colorId, volumeUsed);
    }

    await db.collection('orders').insertOne(newOrder);
    return newOrder;
  }
}

export const dbManager = new DatabaseManager();
