import type { z } from 'zod';

import type * as bakerProfile from '../../validation/baker-profile.schema';

export namespace BakerProfileDTO {
  export type RegisterRequest = z.infer<typeof bakerProfile.registerSchema>;
  export type UpdateRequest = z.infer<typeof bakerProfile.updateSchema>;
  export type RequestParams = z.infer<typeof bakerProfile.paramsSchema>;

  export interface ProfileResponse {
    bakerProfile: {
      userId: string;
      name: string;
      email: string;
      phone: string | null;
      pfpUrl: string | null;
      bio: string | null;
      instagram: string | null;
      neighborhood: string | null;
      city: string | null;
      location: {
        latitude: number;
        longitude: number;
      } | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }

  export interface PublicProfileResponse {
    bakerProfile: {
      userId: string;
      name: string;
      pfpUrl: string | null;
      phone: string | null;
      bio: string | null;
      instagram: string | null;
      neighborhood: string | null;
      city: string | null;
    };
  }
}
