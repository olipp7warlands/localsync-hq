import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { scanQueue, syncQueue } from '../jobs/queues';

const router = Router();

// GET /api/locations
router.get('/', async (req: Request, res: Response) => {
  const locations = await prisma.location.findMany({
    where: { orgId: req.orgId },
    orderBy: { healthScore: 'asc' },
    include: {
      _count: { select: { listings: true, alerts: true } },
      listings: { select: { platform: true, status: true } },
    },
  });
  res.json(locations);
});

// GET /api/locations/:id
router.get('/:id', async (req: Request, res: Response) => {
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
    include: { listings: true, alerts: { where: { status: 'open' } } },
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  res.json(location);
});

// POST /api/locations
router.post('/', async (req: Request, res: Response) => {
  const { name, city, state, sourceOfTruth } = req.body;
  if (!name || !city || !state || !sourceOfTruth) {
    res.status(400).json({ error: 'name, city, state, sourceOfTruth are required' });
    return;
  }
  const location = await prisma.location.create({
    data: { orgId: req.orgId!, name, city, state, sourceOfTruth },
  });
  res.status(201).json(location);
});

// PATCH /api/locations/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const { name, city, state, sourceOfTruth } = req.body;
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const updated = await prisma.location.update({
    where: { id: req.params.id },
    data: { name, city, state, sourceOfTruth },
  });
  res.json(updated);
});

// DELETE /api/locations/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  await prisma.location.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// GET /api/locations/:id/listings
router.get('/:id/listings', async (req: Request, res: Response) => {
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const listings = await prisma.listing.findMany({
    where: { locationId: req.params.id },
    orderBy: { platform: 'asc' },
  });
  res.json(listings);
});

// POST /api/locations/:id/scan
router.post('/:id/scan', async (req: Request, res: Response) => {
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const job = await scanQueue.add('scan-location', {
    locationId: req.params.id,
    orgId: req.orgId,
  });
  res.json({ jobId: job.id, status: 'queued' });
});

// POST /api/locations/:id/sync
router.post('/:id/sync', async (req: Request, res: Response) => {
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
    include: { listings: true },
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const platforms = [...new Set(location.listings.map((l: { platform: string }) => l.platform))];
  const jobs = await Promise.all(
    platforms.map((platform) =>
      syncQueue.add('sync-platform', {
        locationId: req.params.id,
        orgId: req.orgId,
        platform,
      })
    )
  );
  res.json({ jobIds: jobs.map((j) => j.id), status: 'queued', platforms });
});

// POST /api/locations/:id/sync/:platform
router.post('/:id/sync/:platform', async (req: Request, res: Response) => {
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const job = await syncQueue.add('sync-platform', {
    locationId: req.params.id,
    orgId: req.orgId,
    platform: req.params.platform,
  });
  res.json({ jobId: job.id, status: 'queued', platform: req.params.platform });
});

export default router;
