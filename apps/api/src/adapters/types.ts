export interface ListingData {
  name: string;
  phone: string;
  address: string;
  hours: Record<string, string>;
  website?: string;
  categories?: string[];
  description?: string;
}

export interface PlatformAdapter {
  platform: string;
  fetchListing(locationId: string): Promise<ListingData>;
  updateListing(locationId: string, data: ListingData): Promise<void>;
}
