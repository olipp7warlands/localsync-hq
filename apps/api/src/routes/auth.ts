import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function signToken(userId: string, orgId: string, email: string): string {
  const secret = process.env.JWT_SECRET ?? 'change-me-in-production';
  return jwt.sign({ userId, orgId, email }, secret, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, orgName } = req.body as {
    email: string;
    password: string;
    orgName: string;
  };

  if (!email || !password || !orgName) {
    res.status(400).json({ error: 'email, password, and orgName are required' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = makeSlug(orgName);

  const org = await prisma.organization.create({
    data: { name: orgName, slug: `${slug}-${Date.now()}` },
  });

  const user = await prisma.user.create({
    data: { email, passwordHash, orgId: org.id },
  });

  const token = signToken(user.id, org.id, user.email);
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, orgId: user.orgId },
    org: { id: org.id, name: org.name, slug: org.slug },
  });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
  const token = signToken(user.id, user.orgId, user.email);

  res.json({
    token,
    user: { id: user.id, email: user.email, orgId: user.orgId },
    org,
  });
});

export default router;
