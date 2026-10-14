export interface BakerProfileLocation {
  latitude: number;
  longitude: number;
}

export interface BakerTag {
  id: number;
  name: string;
}

export interface BakerProfile {
  userId: string;
  name: string;
  publicName: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  pfpUrl: string | null;
  bio: string | null;
  instagram: string | null;
  neighborhood: string | null;
  city: string | null;
  location: BakerProfileLocation | null;
  tags: BakerTag[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PublicBakerProfile {
  userId: string;
  name: string;
  publicName: string | null;
  pfpUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  instagram: string | null;
  neighborhood: string | null;
  city: string | null;
  tags: BakerTag[];
  updatedAt?: Date | string;
}

export interface BakerProfileRegisterInput {
  publicName?: string | null;
  bio?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  location?: BakerProfileLocation | null;
  tagIds?: number[];
  tags?: number[];
}

export interface BakerProfileUpdateInput {
  publicName?: string | null;
  bio?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  location?: BakerProfileLocation | null;
  tagIds?: number[];
  tags?: number[];
}

export interface NearbyBakerItem {
  userId: string;
  name: string;
  publicName: string | null;
  pfpUrl: string | null;
  distance?: number | null;
  neighborhood: string | null;
  city: string | null;
  tags?: BakerTag[];
  updatedAt?: Date | string;
}

export interface NearbyBakersQuery {
  lat: number;
  lng: number;
  radius?: number; // In meters (e.g. 5000, 10000, 15000)
  page?: number;
  tags?: string[] | string;
}

export interface NeighborhoodBakersQuery {
  search?: string;
  query?: string;
  neighborhood?: string;
  page?: number;
  tags?: string[] | string;
}

export interface NearbyBakersResponse {
  data: {
    bakerProfiles: NearbyBakerItem[];
  };
  message?: string;
}

export interface NeighborhoodBakersResponse {
  data: {
    bakerProfiles: NearbyBakerItem[];
  };
  message?: string;
}
