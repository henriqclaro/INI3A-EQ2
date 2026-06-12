import { PartialTag } from './tag';

export interface PartialRecipe {
  id: string;
  title: string;
  coverUrl: string | null;
  prepTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  tags: {
    tag: PartialTag;
  }[];
}

export interface FullRecipe {
  id: string;
  userId: string | null;
  parentId: string | null;
  title: string;
  coverUrl: string | null;
  instructions: JSON;
  baseYield: string;
  yieldUnit: string;

  status: string;
  totalSaves: number;
  totalReviews: number;
  averageRating: string;

  profitMargin: string;
  overhead: string;
  prepTimeMinutes: number;
  hourlyLabor: string;
  packagingCost: string;

  createdAt: Date;
  updatedAt: Date;
}
