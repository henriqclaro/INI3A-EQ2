import { PartialTag } from './tag';

export interface PartialRecipe {
  id: string;
  title: string;
  coverUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: {
    tag: PartialTag;
  }[];
}
