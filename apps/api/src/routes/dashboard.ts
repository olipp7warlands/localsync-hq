import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/dashboard
router.get('/', async (req: Request, res: Response) => {
  const orgId = req.orgId!;

  const [locations, listingStats, openAlerts, recentAlerts] = await Promise.all([
    prisma.location.findMany({
      where: { orgId },
      select: { id: true, name: true, city: true, state: true, healthScore: true },
      orderBy: { healthScore: 'asc' },
    }),
    prisma.listing.groupBy({
      by: ['status'],
      where: { location: { orgId } },
      _count: true,
    }),
    prisma.alert.count({ where: { orgId, status: 'open' } }),
    prisma.alert.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { location: { select: { name: true, city: true, state: true } } },
    }),
  ]);

  const totalLocations = locations.length;
  const avgHealthScore =
    totalLocations > 0
      ? Math.round(
          locations.reduce((sum: number, l: { healthScore: number }) => sum + l.healthScore, 0) /
            totalLocations
        )
      : 0;

  const syncedListings =
    listingStats.find((s: { status: string }) => s.status === 'synced')?._count ?? 0;
  const driftedListings =
    listingStats.find((s: { status: string }) => s.status === 'drifted')?._count ?? 0;

  res.json({
    totalLocations,
    avgHealthScore,
    openAlerts,
    syncedListings,
    driftedListings,
    locationHealth: locations,
    recentAlerts,
  });
});

export default router;
