import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbManager, User } from '../db/db.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { storageService } from '../services/storage.js';

// Pakistani phone regex: 0300 1111111 or 03001111111 or +923001111111
const PK_PHONE_REGEX = /^(?:\+92|92|0)?3[0-9]{2}[\s-]?[0-9]{7}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidPakistaniPhone(phone: string): boolean {
  return PK_PHONE_REGEX.test(phone.trim());
}

export function normalizePakistaniPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('923') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return digits;
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return '0' + digits;
  }
  return phone.trim();
}

function sanitizeUser(user: User) {
  return {
    id: user.id,
    uuid: user.uuid || user.id,
    serialNumber: user.serialNumber,
    primaryCommunication: user.primaryCommunication,
    primaryType: user.primaryType,
    email: user.email || '',
    phone: user.phone || '',
    name: user.name || '',
    shopName: user.shopName || '',
    shopAddress: user.shopAddress || '',
    alternativeCommunication: user.alternativeCommunication || '',
    profilePicture: user.profilePicture || '',
    companyLogo: user.companyLogo || '',
    createdAt: user.createdAt,
  };
}

export async function handleSignUp(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password } = req.body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      res.status(400).json({ error: 'Phone number or email is required.' });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    const trimmedIdentifier = identifier.trim();

    if (trimmedIdentifier.length > 80) {
      res.status(400).json({ error: 'Identifier exceeds maximum allowed length of 80 characters.' });
      return;
    }

    if (password.length < 6 || password.length > 50) {
      res.status(400).json({ error: 'Password must be between 6 and 50 characters.' });
      return;
    }

    let primaryType: 'phone' | 'email';
    let normalizedCommunication: string;
    let email: string | undefined;
    let phone: string | undefined;

    if (trimmedIdentifier.includes('@')) {
      if (!EMAIL_REGEX.test(trimmedIdentifier)) {
        res.status(400).json({ error: 'Please provide a valid email address format.' });
        return;
      }
      primaryType = 'email';
      normalizedCommunication = trimmedIdentifier.toLowerCase();
      email = normalizedCommunication;
    } else {
      if (!isValidPakistaniPhone(trimmedIdentifier)) {
        res.status(400).json({ 
          error: 'Please enter a valid Pakistani phone number pattern (e.g. 0300 1111111 or 03001111111).' 
        });
        return;
      }
      primaryType = 'phone';
      normalizedCommunication = normalizePakistaniPhone(trimmedIdentifier);
      phone = normalizedCommunication;
    }

    const existingUser = await dbManager.findUserByEmailOrPhone(normalizedCommunication);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this communication method already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await dbManager.createUser({
      primaryType,
      primaryCommunication: normalizedCommunication,
      email,
      phone,
      passwordHash,
      name: '',
      shopName: '',
      shopAddress: '',
      alternativeCommunication: '',
    });

    const token = generateToken({
      id: newUser.id,
      uuid: newUser.uuid,
      serialNumber: newUser.serialNumber,
      primaryCommunication: newUser.primaryCommunication,
      primaryType: newUser.primaryType,
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error: any) {
    console.error('Sign-up error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function handleSignIn(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Phone number or email, and password are required.' });
      return;
    }

    if (identifier.length > 80 || password.length > 50) {
      res.status(400).json({ error: 'Input exceeded length limit.' });
      return;
    }

    const user = await dbManager.findUserByEmailOrPhone(identifier);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      uuid: user.uuid || user.id,
      serialNumber: user.serialNumber,
      primaryCommunication: user.primaryCommunication,
      primaryType: user.primaryType,
    });

    res.json({
      message: 'Sign in successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error('Sign-in error:', error);
    res.status(500).json({ error: 'Internal server error during sign in.' });
  }
}

export async function handleGetMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await dbManager.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

export async function handleUpdateSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const currentUser = await dbManager.findUserById(req.user.id);
    if (!currentUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const {
      name,
      shopName,
      shopAddress,
      email,
      phone,
      alternativeCommunication,
      profilePictureBase64,
      companyLogoBase64,
    } = req.body;

    const updates: Partial<User> = {};

    if (typeof name === 'string') {
      if (name.length > 60) {
        res.status(400).json({ error: 'Name cannot exceed 60 characters.' });
        return;
      }
      updates.name = name.trim();
    }

    if (typeof shopName === 'string') {
      if (shopName.length > 70) {
        res.status(400).json({ error: 'Shop name cannot exceed 70 characters.' });
        return;
      }
      updates.shopName = shopName.trim();
    }

    if (typeof shopAddress === 'string') {
      if (shopAddress.length > 120) {
        res.status(400).json({ error: 'Shop address cannot exceed 120 characters.' });
        return;
      }
      updates.shopAddress = shopAddress.trim();
    }

    if (currentUser.primaryType === 'phone') {
      if (typeof email === 'string') {
        const cleanEmail = email.trim();
        if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
          res.status(400).json({ error: 'Please provide a valid email format.' });
          return;
        }
        updates.email = cleanEmail;
      }
    } else {
      if (typeof phone === 'string') {
        const cleanPhone = phone.trim();
        if (cleanPhone && !isValidPakistaniPhone(cleanPhone)) {
          res.status(400).json({ error: 'Please enter a valid Pakistani phone number (e.g. 0300 1111111).' });
          return;
        }
        updates.phone = cleanPhone ? normalizePakistaniPhone(cleanPhone) : '';
      }
    }

    if (typeof alternativeCommunication === 'string') {
      updates.alternativeCommunication = alternativeCommunication.trim();
    }

    const userUuid = currentUser.uuid || currentUser.id;

    // Upload profile picture to Cloudflare bucket paint-shop/{userUuid}/profilePicture.<ext>
    if (profilePictureBase64 && typeof profilePictureBase64 === 'string') {
      const match = profilePictureBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const rawExt = mimeType.split('/')[1] || 'png';
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        const buffer = Buffer.from(match[2], 'base64');
        const filename = `profilePicture.${ext}`;

        const uploadResult = await storageService.uploadShopImage({
          userUuid,
          filename,
          buffer,
          mimeType,
        });

        updates.profilePicture = uploadResult.url;
      }
    }

    // Upload company logo to Cloudflare bucket paint-shop/{userUuid}/companyLogo.<ext>
    if (companyLogoBase64 && typeof companyLogoBase64 === 'string') {
      const match = companyLogoBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const rawExt = mimeType.split('/')[1] || 'png';
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        const buffer = Buffer.from(match[2], 'base64');
        const filename = `companyLogo.${ext}`;

        const uploadResult = await storageService.uploadShopImage({
          userUuid,
          filename,
          buffer,
          mimeType,
        });

        updates.companyLogo = uploadResult.url;
      }
    }

    const updatedUser = await dbManager.updateUser(currentUser.id, updates);
    if (!updatedUser) {
      res.status(500).json({ error: 'Failed to update user profile.' });
      return;
    }

    res.json({
      message: 'Settings saved successfully.',
      user: sanitizeUser(updatedUser),
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
}

// Inventory & Billing Handlers
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_PER_PRODUCT = 8;

/** Adds `imageUrls` (parallel to `images`) and `imageUrl` (the cover) to a product for the client. */
function withImageUrls(item: any, user?: { uuid: string; id: string }) {
  const owner = user ? (user.uuid || user.id) : undefined;
  let imageUrls: string[] = [];
  if (item.serialNumber && Array.isArray(item.images) && item.images.length && owner) {
    imageUrls = item.images.map((f: string) => storageService.buildUrl(owner, `${item.serialNumber}/${f}`));
  } else if (item.imageUrl) {
    imageUrls = [item.imageUrl];
  }
  return { ...item, imageUrls, imageUrl: imageUrls[0] };
}

// Inventory & Billing Handlers
export async function handleGetInventory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await dbManager.getInventory(req.user?.id);
    res.json(items.map((it) => withImageUrls(it, it.userId && it.userId === req.user?.id ? req.user : undefined)));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve inventory.' });
  }
}

/**
 * Uploads data-URL images to paint-shop/{shop uuid}/{product serial}/{n}.{ext}.
 * `n` continues from the highest number already used (1, 2, 3, ...).
 * Returns the new file names plus a message for every image that was rejected.
 */
async function saveProductImages(
  user: { uuid: string; id: string },
  serialNumber: number,
  existing: string[],
  dataUrls: string[]
): Promise<{ added: string[]; errors: string[] }> {
  const added: string[] = [];
  const errors: string[] = [];
  let next = existing.reduce((m, f) => Math.max(m, parseInt(f, 10) || 0), 0) + 1;
  const room = Math.max(0, MAX_IMAGES_PER_PRODUCT - existing.length);

  if (dataUrls.length > room) errors.push(`A product can have at most ${MAX_IMAGES_PER_PRODUCT} images; extra images were skipped.`);

  for (const dataUrl of dataUrls.slice(0, room)) {
    try {
      const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
      if (!match) throw new Error('Images must be PNG, JPG or WebP files.');
      const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > MAX_PRODUCT_IMAGE_BYTES) throw new Error('Each image must be 5 MB or smaller.');
      const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
      const fileName = `${next}.${ext}`;
      await storageService.uploadShopImage({
        userUuid: user.uuid || user.id,
        filename: `${serialNumber}/${fileName}`,
        buffer,
        mimeType,
      });
      added.push(fileName);
      next++;
    } catch (err: any) {
      errors.push(err?.message || 'Image upload failed.');
    }
  }
  return { added, errors };
}

export async function handleAddInventoryItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, category, unit, quantity, unitPrice, sku, hex, description, images } = req.body;
    if (!name || !category || !unit || quantity === undefined || unitPrice === undefined) {
      res.status(400).json({ error: 'Missing required inventory fields.' });
      return;
    }

    let newItem = await dbManager.addInventoryItem({
      userId: req.user?.id,
      name: name.trim(),
      category,
      unit,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      sku: sku ? String(sku).trim() : undefined,
      hex: hex ? String(hex).trim() : undefined,
      description: description ? String(description).trim() : undefined,
    });

    // The product is saved even if some photos fail to upload; the client is told why.
    let imageErrors: string[] = [];
    if (Array.isArray(images) && images.length && req.user && newItem.serialNumber) {
      const { added, errors } = await saveProductImages(req.user, newItem.serialNumber, [], images);
      imageErrors = errors;
      if (added.length) {
        newItem = (await dbManager.updateInventoryItem(newItem.id, req.user.id, { images: added })) || newItem;
      }
    }

    const body: any = withImageUrls(newItem, req.user);
    if (imageErrors.length) body.imageErrors = imageErrors;
    res.status(201).json(body);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add inventory item.' });
  }
}

export async function handleUpdateInventoryItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized.' }); return; }
    const { name, description, unitPrice, sku, addImages, removeImages } = req.body;

    const current = (await dbManager.getInventory(req.user.id)).find((i) => i.id === req.params.id && i.userId === req.user!.id);
    if (!current) {
      res.status(404).json({ error: 'Product not found, or it is a shared sample item that cannot be edited.' });
      return;
    }

    const updates: Record<string, any> = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof description === 'string') updates.description = description.trim();
    if (typeof sku === 'string') updates.sku = sku.trim();
    if (unitPrice !== undefined) {
      const price = Number(unitPrice);
      if (!Number.isFinite(price) || price < 0) { res.status(400).json({ error: 'Invalid price.' }); return; }
      updates.unitPrice = price;
    }

    // Product images: files live in <shop folder>/<serialNumber>/<n>.<ext>
    let images = [...(current.images || [])];
    let imageErrors: string[] = [];
    const owner = req.user.uuid || req.user.id;

    if (Array.isArray(removeImages) && removeImages.length && current.serialNumber) {
      for (const f of removeImages) {
        if (typeof f !== 'string' || !images.includes(f)) continue;
        try { await storageService.deleteShopImage(owner, `${current.serialNumber}/${f}`); } catch (e) { console.error('Image delete failed:', e); }
        images = images.filter((x) => x !== f);
      }
    }
    if (Array.isArray(addImages) && addImages.length && current.serialNumber) {
      const { added, errors } = await saveProductImages(req.user, current.serialNumber, images, addImages);
      images = [...images, ...added];
      imageErrors = errors;
      if (!added.length && errors.length) { res.status(400).json({ error: errors[0] }); return; }
    }
    if (Array.isArray(removeImages) || Array.isArray(addImages)) updates.images = images;

    const updated = await dbManager.updateInventoryItem(req.params.id, req.user.id, updates);
    if (!updated) { res.status(404).json({ error: 'Product not found.' }); return; }

    const body: any = withImageUrls(updated, req.user);
    if (imageErrors.length) body.imageErrors = imageErrors;
    res.json(body);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update inventory item.' });
  }
}

export async function handleGetInvoices(req: AuthRequest, res: Response): Promise<void> {
  try {
    const invoices = await dbManager.getInvoices(req.user?.id);
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve invoices.' });
  }
}

export async function handleCreateInvoice(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { customerName, customerPhone, customerEmail, items, paymentMethod, taxAmount, discountAmount } = req.body;
    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Customer name and line items are required.' });
      return;
    }

    let subtotalSum = 0;
    const formattedItems = [];
    for (const it of items) {
      const quantity = Number(it.quantity);
      const unitPrice = Number(it.unitPrice);
      if (!it.name || !Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        res.status(400).json({ error: 'Each line needs a product, a whole quantity of at least 1, and a valid price.' });
        return;
      }
      const lineSubtotal = quantity * unitPrice;
      subtotalSum += lineSubtotal;
      formattedItems.push({
        inventoryId: it.inventoryId ? String(it.inventoryId) : undefined,
        name: String(it.name),
        unit: it.unit ? String(it.unit) : undefined,
        quantity,
        unitPrice,
        subtotal: lineSubtotal,
      });
    }

    const tax = Number(taxAmount || 0);
    const discount = Number(discountAmount || 0);
    const totalAmount = Math.max(0, subtotalSum + tax - discount);

    const invoice = await dbManager.createInvoice({
      userId: req.user?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      items: formattedItems,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount,
      status: 'paid',
      paymentMethod: paymentMethod || 'cash',
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    if (error?.code === 'INSUFFICIENT_STOCK') {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to create invoice.' });
  }
}
