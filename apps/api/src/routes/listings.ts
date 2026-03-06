import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/listings/:id
router.get('/:id', async (req: Request, res: Response) => {
  const listing = await prisma.listing.findFirst({
    where: { id: req.params.id, location: { orgId: req.orgId } },
    include: { location: true },
  });
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }
  res.json(listing);
});

export default router;
