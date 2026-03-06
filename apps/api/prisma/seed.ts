import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PLATFORMS = ['google', 'yelp', 'apple_maps', 'bing', 'facebook'] as const;

const LOCATIONS = [
  { name: 'Bright Smile Downtown', city: 'Chicago', state: 'IL', phone: '(312) 555-0101', address: '123 N Michigan Ave, Chicago, IL 60601' },
  { name: 'Bright Smile North Side', city: 'Chicago', state: 'IL', phone: '(312) 555-0102', address: '456 N Clark St, Chicago, IL 60614' },
  { name: 'Bright Smile Lincoln Park', city: 'Chicago', state: 'IL', phone: '(312) 555-0103', address: '789 W Fullerton Ave, Chicago, IL 60614' },
  { name: 'Bright Smile Oak Park', city: 'Oak Park', state: 'IL', phone: '(708) 555-0104', address: '321 Lake St, Oak Park, IL 60301' },
  { name: 'Bright Smile Naperville', city: 'Naperville', state: 'IL', phone: '(630) 555-0105', address: '555 S Washington St, Naperville, IL 60540' },
  { name: 'Bright Smile Evanston', city: 'Evanston', state: 'IL', phone: '(847) 555-0106', address: '1001 Church St, Evanston, IL 60201' },
  { name: 'Bright Smile Schaumburg', city: 'Schaumburg', state: 'IL', phone: '(847) 555-0107', address: '200 E Golf Rd, Schaumburg, IL 60173' },
  { name: 'Bright Smile Aurora', city: 'Aurora', state: 'IL', phone: '(630) 555-0108', address: '77 S River St, Aurora, IL 60506' },
  { name: 'Bright Smile Joliet', city: 'Joliet', state: 'IL', phone: '(815) 555-0109', address: '150 N Chicago St, Joliet, IL 60432' },
  { name: 'Bright Smile Rockford', city: 'Rockford', state: 'IL', phone: '(815) 555-0110', address: '220 E State St, Rockford, IL 61104' },
  { name: 'Bright Smile Peoria', city: 'Peoria', state: 'IL', phone: '(309) 555-0111', address: '300 SW Jefferson Ave, Peoria, IL 61602' },
  { name: 'Bright Smile Springfield', city: 'Springfield', state: 'IL', phone: '(217) 555-0112', address: '500 E Monroe St, Springfield, IL 62701' },
  { name: 'Bright Smile Champaign', city: 'Champaign', state: 'IL', phone: '(217) 555-0113', address: '102 N Neil St, Champaign, IL 61820' },
  { name: 'Bright Smile Bloomington', city: 'Bloomington', state: 'IL', phone: '(309) 555-0114', address: '400 N Main St, Bloomington, IL 61701' },
  { name: 'Bright Smile Decatur', city: 'Decatur', state: 'IL', phone: '(217) 555-0115', address: '250 E Eldorado St, Decatur, IL 62523' },
];

const STANDARD_HOURS = {
  Monday: '9:00 AM - 6:00 PM',
  Tuesday: '9:00 AM - 6:00 PM',
  Wednesday: '9:00 AM - 6:00 PM',
  Thursday: '9:00 AM - 6:00 PM',
  Friday: '9:00 AM - 5:00 PM',
  Saturday: '9:00 AM - 2:00 PM',
  Sunday: 'Closed',
};

// Drift variations for different platforms
function getDriftedData(
  source: { name: string; phone: string; address: string },
  listingIndex: number,
  status: string
) {
  if (status === 'synced') return null;

  const drifts = [
    { phone: source.phone.replace(/\d{4}$/, '9999') },
    { hours: { ...STANDARD_HOURS, Monday: '9:00 AM - 4:00 PM' } },
    { address: source.address.replace(/^\d+/, '999') },
    { name: source.name + ' - Suite 2' },
    { phone: source.phone.replace(/\d{4}$/, '0000'), hours: { ...STANDARD_HOURS, Saturday: 'Closed' } },
  ];

  return drifts[listingIndex % drifts.length];
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.alert.deleteMany();
  await prisma.syncJob.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create org
  const org = await prisma.organization.create({
    data: {
      name: 'Bright Smile Dental Group',
      slug: 'bright-smile-dental-group',
    },
  });
  console.log(`Created org: ${org.name}`);

  // Create admin user
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@brightsmile.com',
      passwordHash,
      orgId: org.id,
    },
  });
  console.log('Created admin user: admin@brightsmile.com / password123');

  // Create locations and listings
  const createdAlerts: Array<{
    orgId: string;
    locationId: string;
    listingId: string;
    field: string;
    platform: string;
    expected: string;
    actual: string;
    severity: string;
    status: string;
    resolvedAt?: Date;
  }> = [];

  for (let li = 0; li < LOCATIONS.length; li++) {
    const loc = LOCATIONS[li];

    const sourceOfTruth = {
      name: loc.name,
      phone: loc.phone,
      address: loc.address,
      hours: STANDARD_HOURS,
      website: `https://brightsmile.com/${loc.city.toLowerCase().replace(/\s+/g, '-')}`,
      categories: ['Dentist', 'Dental Clinic', 'Cosmetic Dentist'],
      description: `${loc.name} provides comprehensive dental care services in ${loc.city}, ${loc.state}.`,
    };

    const location = await prisma.location.create({
      data: {
        orgId: org.id,
        name: loc.name,
        city: loc.city,
        state: loc.state,
        sourceOfTruth,
        healthScore: 100, // will be computed below
      },
    });

    let driftedListings = 0;

    for (let pi = 0; pi < PLATFORMS.length; pi++) {
      const platform = PLATFORMS[pi];
      const globalIndex = li * PLATFORMS.length + pi;

      // Diverse health scores: 0%(×3), 20%(×2), 40%(×2), 60%(×3), 80%(×2), 100%(×3)
      // drifted count determines health: 5→0%, 4→20%, 3→40%, 2→60%, 1→80%, 0→100%
      const driftedPlatformsPerLocation = [5, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 0, 0, 0];
      const maxDrifted = driftedPlatformsPerLocation[li] ?? 0;
      let status: string;
      if (pi < maxDrifted) status = 'drifted';
      else if (pi === 4 && li % 4 === 0 && li > 0) status = 'error';
      else status = 'synced';

      const drift = status === 'drifted' ? getDriftedData(loc, pi, status) : null;
      const listingData = {
        name: drift?.name ?? loc.name,
        phone: drift?.phone ?? loc.phone,
        address: drift?.address ?? loc.address,
        hours: drift?.hours ?? STANDARD_HOURS,
        website: sourceOfTruth.website,
        categories: sourceOfTruth.categories,
        description: sourceOfTruth.description,
      };

      const driftFields = [];
      if (drift?.name && drift.name !== loc.name) driftFields.push('name');
      if (drift?.phone && drift.phone !== loc.phone) driftFields.push('phone');
      if (drift?.address && drift.address !== loc.address) driftFields.push('address');
      if (drift?.hours) driftFields.push('hours');

      if (status === 'drifted') driftedListings++;

      const listing = await prisma.listing.create({
        data: {
          locationId: location.id,
          platform,
          status,
          data: listingData,
          driftFields,
          lastSyncedAt: status === 'synced' ? new Date(Date.now() - Math.random() * 86400000 * 7) : null,
        },
      });

      // Create alerts for drifted fields
      if (status === 'drifted' && driftFields.length > 0) {
        for (const field of driftFields) {
          const rawExpected = (sourceOfTruth as Record<string, unknown>)[field] ?? '';
          const rawActual = (listingData as Record<string, unknown>)[field] ?? '';
          const expected = typeof rawExpected === 'object' ? JSON.stringify(rawExpected) : String(rawExpected);
          const actual = typeof rawActual === 'object' ? JSON.stringify(rawActual) : String(rawActual);
          const severity = ['phone', 'address'].includes(field) ? 'high' : 'medium';
          // ~80% open, ~20% resolved
          const alertStatus = globalIndex % 5 === 0 ? 'resolved' : 'open';

          createdAlerts.push({
            orgId: org.id,
            locationId: location.id,
            listingId: listing.id,
            field,
            platform,
            expected: typeof expected === 'object' ? JSON.stringify(expected) : expected,
            actual: typeof actual === 'object' ? JSON.stringify(actual) : actual,
            severity,
            status: alertStatus,
            resolvedAt: alertStatus === 'resolved' ? new Date() : undefined,
          });
        }
      }

      // Error status gets an alert too
      if (status === 'error') {
        createdAlerts.push({
          orgId: org.id,
          locationId: location.id,
          listingId: listing.id,
          field: 'sync',
          platform,
          expected: 'success',
          actual: 'Connection timeout',
          severity: 'critical',
          status: 'open',
        });
      }
    }

    // Compute health score
    const healthScore = Math.round(100 - (driftedListings / PLATFORMS.length) * 100);
    await prisma.location.update({
      where: { id: location.id },
      data: { healthScore },
    });

    console.log(`  Created location: ${loc.name} (health: ${healthScore})`);
  }

  // Insert alerts
  await prisma.alert.createMany({ data: createdAlerts });
  console.log(`Created ${createdAlerts.length} alerts`);

  const openCount = createdAlerts.filter((a) => a.status === 'open').length;
  const resolvedCount = createdAlerts.filter((a) => a.status === 'resolved').length;
  console.log(`  Open: ${openCount}, Resolved: ${resolvedCount}`);

  console.log('\nSeed complete!');
  console.log('Login: admin@brightsmile.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
