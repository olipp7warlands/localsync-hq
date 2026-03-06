// Shared TypeScript types mirroring Prisma models

export type Platform =
  | 'google'
  | 'yelp'
  | 'apple_maps'
  | 'bing'
  | 'facebook'
  | 'tripadvisor'
  | 'foursquare';

export type ListingStatus = 'synced' | 'drifted' | 'error' | 'pending';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'resolved';
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceOfTruth {
  name: string;
  phone: string;
  address: string;
  hours: Record<string, string>;
  website?: string;
  categories?: string[];
  description?: string;
}

export interface Location {
  id: string;
  orgId: string;
  name: string;
  city: string;
  state: string;
  sourceOfTruth: SourceOfTruth;
  healthScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingData {
  name: string;
  phone: string;
  address: string;
  hours: Record<string, string>;
  website?: string;
  categories?: string[];
  description?: string;
}

export interface Listing {
  id: string;
  locationId: string;
  platform: Platform;
  status: ListingStatus;
  data: ListingData;
  driftFields: string[];
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  orgId: string;
  locationId: string;
  listingId: string;
  field: string;
  platform: Platform;
  expected: string;
  actual: string;
  severity: AlertSeverity;
  status: AlertStatus;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncJob {
  id: string;
  orgId: string;
  locationId: string;
  platform: Platform | null;
  status: JobStatus;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface DashboardStats {
  totalLocations: number;
  avgHealthScore: number;
  openAlerts: number;
  syncedListings: number;
  driftedListings: number;
  locationHealth: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    healthScore: number;
  }>;
  recentAlerts: Alert[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  org: Organization;
}
