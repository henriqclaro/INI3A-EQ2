export type TagType = 'USER' | 'PRODUCT' | 'VARIETY' | 'ATTRIBUTE';

export interface Tag {
  id: number;
  name: string;
  type: TagType;
  creatorId?: string | null;
  createdAt?: Date | string;
}

export interface PartialTag {
  type: string;
  name: string;
  id: string | number;
}
