export interface BakerProfileLocation {
  latitude: number;
  longitude: number;
}

export interface BakerProfile {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  pfpUrl: string | null;
  bio: string | null;
  instagram: string | null;
  neighborhood: string | null;
  city: string | null;
  location: BakerProfileLocation | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PublicBakerProfile {
  userId: string;
  name: string;
  pfpUrl: string | null;
  phone: string | null;
  bio: string | null;
  instagram: string | null;
  neighborhood: string | null;
  city: string | null;
}

export interface BakerProfileRegisterInput {
  bio?: string | null;
  instagram?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  location?: BakerProfileLocation | null;
}

export interface BakerProfileUpdateInput {
  bio?: string | null;
  instagram?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  location?: BakerProfileLocation | null;
}
