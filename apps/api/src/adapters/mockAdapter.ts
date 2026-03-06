import { PlatformAdapter, ListingData } from './types';
import { prisma } from '../lib/prisma';

// Fields that can drift
const DRIFT_FIELDS: (keyof ListingData)[] = ['phone', 'hours', 'address', 'name'];

function applyRandomDrift(data: ListingData): ListingData {
  const drifted = JSON.parse(JSON.stringify(data)) as ListingData;

  for (const field of DRIFT_FIELDS) {
    if (Math.random() < 0.1) {
      // 10% chance per field
      if (field === 'phone') {
        // Scramble last 4 digits
        drifted.phone = data.phone.replace(/\d{4}$/, String(Math.floor(1000 + Math.random() * 9000)));
      } else if (field === 'address') {
        drifted.address = data.address.replace(/^\d+/, String(Math.floor(100 + Math.random() * 9900)));
      } else if (field === 'name') {
        drifted.name = data.name + (Math.random() > 0.5 ? ' - Downtown' : ' Location');
      } else if (field === 'hours') {
        // Close an hour earlier on Monday
        drifted.hours = { ...data.hours, Monday: '9:00 AM - 4:00 PM' };
      }
    }
  }

  return drifted;
}

export class MockAdapter implements PlatformAdapter {
  platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  async fetchListing(locationId: string): Promise<ListingData> {
    const listing = await prisma.listing.findFirst({
      where: { locationId, platform: this.platform },
    });

    if (!listing) {
      throw new Error(`No listing found for location ${locationId} on ${this.platform}`);
    }

    // Simulate the remote platform having random drift
    return applyRandomDrift(listing.data as ListingData);
  }

  async updateListing(_locationId: string, _data: ListingData): Promise<void> {
    // Simulate a network call with a short delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 150));
    // In a real adapter, we'd call the platform's API here
  }
}

export function getAdapter(platform: string): PlatformAdapter {
  return new MockAdapter(platform);
}
