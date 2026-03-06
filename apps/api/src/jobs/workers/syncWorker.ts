import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };
import { getAdapter } from '../../adapters/mockAdapter';
import { ListingData } from '../../adapters/types';

interface SyncJobData {
  locationId: string;
  orgId: string;
  platform: string;
}

async function processJob(job: Job<SyncJobData>): Promise<void> {
  const { locationId, orgId, platform } = job.data;

  const syncJob = await prisma.syncJob.create({
    data: { orgId, locationId, platform, status: 'running', startedAt: new Date() },
  });

  try {
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new Error(`Location ${locationId} not found`);

    const listing = await prisma.listing.findFirst({
      where: { locationId, platform },
    });
    if (!listing) throw new Error(`Listing for ${platform} not found at ${locationId}`);

    const adapter = getAdapter(platform);
    const sourceOfTruth = location.sourceOfTruth as ListingData;

    // Push source-of-truth data to the platform
    await adapter.updateListing(locationId, sourceOfTruth);

    // Mark listing as synced
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        status: 'synced',
        driftFields: [],
        data: sourceOfTruth,
        lastSyncedAt: new Date(),
      },
    });

    // Resolve open alerts for this listing
    await prisma.alert.updateMany({
      where: { listingId: listing.id, status: 'open' },
      data: { status: 'resolved', resolvedAt: new Date() },
    });

    // Recompute location health score
    const allListings = await prisma.listing.findMany({ where: { locationId } });
    const driftedCount = allListings.filter((l: { status: string }) => l.status === 'drifted').length;
    const healthScore = Math.round(100 - (driftedCount / allListings.length) * 100);

    await prisma.location.update({
      where: { id: locationId },
      data: { healthScore },
    });

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: 'done', finishedAt: new Date() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { status: 'failed', error: message, finishedAt: new Date() },
    });
    throw err;
  }
}

export const syncWorker = new Worker<SyncJobData>('sync-platform', processJob, {
  connection,
  concurrency: 5,
});

syncWorker.on('completed', (job) => {
  console.log(`[syncWorker] Job ${job.id} completed — ${job.data.platform}@${job.data.locationId}`);
});

syncWorker.on('failed', (job, err) => {
  console.error(`[syncWorker] Job ${job?.id} failed:`, err.message);
});
