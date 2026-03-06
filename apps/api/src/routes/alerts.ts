import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/alerts
router.get('/', async (req: Request, res: Response) => {
  const { status, locationId, platform, severity } = req.query;

  const where: Record<string, unknown> = { orgId: req.orgId };
  if (status) where.status = status;
  if (locationId) where.locationId = locationId;
  if (platform) where.platform = platform;
  if (severity) where.severity = severity;

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { location: { select: { name: true, city: true, state: true } } },
    take: 100,
  });
  res.json(alerts);
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req: Request, res: Response) => {
  const alert = await prisma.alert.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
  });
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  if (alert.status === 'resolved') {
    res.status(400).json({ error: 'Alert is already resolved' });
    return;
  }
  const updated = await prisma.alert.update({
    where: { id: req.params.id },
    data: { status: 'resolved', resolvedAt: new Date() },
  });
  res.json(updated);
});

export default router;
