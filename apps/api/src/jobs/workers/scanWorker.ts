import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };
import { ListingData } from '../../adapters/types';

interface ScanJobData {
  locationId: string;
  orgId: string;
}

function diffFields(source: ListingData, listing: ListingData): string[] {
  const drifted: string[] = [];

  if (source.name !== listing.name) drifted.push('name');
  if (source.phone !== listing.phone) drifted.push('phone');
  if (source.address !== listing.address) drifted.push('address');
  if (JSON.stringify(source.hours) !== JSON.stringify(listing.hours)) drifted.push('hours');
  if ((source.website ?? '') !== (listing.website ?? '')) drifted.push('website');

  return drifted;
}

function scoreSeverity(driftFields: string[]): string {
  if (driftFields.includes('phone') || driftFields.includes('address')) return 'high';
  if (driftFields.includes('hours')) return 'medium';
  return 'low';
}

async function processJob(job: Job<ScanJobData>): Promise<void> {
  const { locationId, orgId } = job.data;

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { listings: true },
  });

  if (!location) throw new Error(`Location ${locationId} not found`);

  const sourceOfTruth = location.sourceOfTruth as unknown as ListingData;
  let driftedCount = 0;

  for (const listing of location.listings) {
    const listingData = listing.data as unknown as ListingData;
    const driftFields = diffFields(sourceOfTruth, listingData);

    if (driftFields.length > 0) {
      driftedCount++;
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: 'drifted', driftFields },
      });

      // Create alerts for each drifted field (skip if already exists + open)
      for (const field of driftFields) {
        const existing = await prisma.alert.findFirst({
          where: {
            listingId: listing.id,
            field,
            status: 'open',
          },
        });

        if (!existing) {
          const sotMap = sourceOfTruth as unknown as Record<string, unknown>;
          const dataMap = listingData as unknown as Record<string, unknown>;
          const rawExpected = sotMap[field] ?? '';
          const rawActual = dataMap[field] ?? '';
          await prisma.alert.create({
            data: {
              orgId,
              locationId,
              listingId: listing.id,
              field,
              platform: listing.platform,
              expected: typeof rawExpected === 'object' ? JSON.stringify(rawExpected) : String(rawExpected),
              actual: typeof rawActual === 'object' ? JSON.stringify(rawActual) : String(rawActual),
              severity: scoreSeverity([field]),
              status: 'open',
            },
          });
        }
      }
    } else {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: 'synced', driftFields: [] },
      });
    }
  }

  // Recompute health score
  const totalListings = location.listings.length;
  const healthScore =
    totalListings > 0 ? Math.round(100 - (driftedCount / totalListings) * 100) : 100;

  await prisma.location.update({
    where: { id: locationId },
    data: { healthScore },
  });
}

export const scanWorker = new Worker<ScanJobData>('scan-location', processJob, {
  connection,
  concurrency: 5,
});

scanWorker.on('completed', (job) => {
  console.log(`[scanWorker] Job ${job.id} completed for location ${job.data.locationId}`);
});

scanWorker.on('failed', (job, err) => {
  console.error(`[scanWorker] Job ${job?.id} failed:`, err.message);
});
