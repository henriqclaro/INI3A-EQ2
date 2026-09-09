import {
  BakerProfile,
  BakerProfileRegisterInput,
  BakerProfileUpdateInput,
  NearbyBakersQuery,
  NearbyBakersResponse,
  PublicBakerProfile,
} from '../types/baker-profile';
import {
  AddShowcaseInput,
  ReorderShowcaseInput,
  ShowcaseItemResponse,
  ShowcaseListResponse,
} from '../types/showcase';
import { api } from './api';

export interface BakerProfileResponse {
  data: {
    bakerProfile: BakerProfile;
  };
}

export interface PublicBakerProfileResponse {
  data: {
    bakerProfile: PublicBakerProfile;
  };
}

export const BakerProfileService = {
  getMyProfile: async (): Promise<BakerProfileResponse> => {
    const response = await api.get<BakerProfileResponse>('/baker-profiles/me');
    return response.data;
  },

  createMyProfile: async (data: BakerProfileRegisterInput): Promise<BakerProfileResponse> => {
    const response = await api.post<BakerProfileResponse>('/baker-profiles/me', data);
    return response.data;
  },

  updateMyProfile: async (data: BakerProfileUpdateInput): Promise<BakerProfileResponse> => {
    const response = await api.patch<BakerProfileResponse>('/baker-profiles/me', data);
    return response.data;
  },

  deleteMyProfile: async (): Promise<void> => {
    await api.delete('/baker-profiles/me');
  },

  getPublicProfile: async (userId: string): Promise<PublicBakerProfileResponse> => {
    const response = await api.get<PublicBakerProfileResponse>(`/baker-profiles/${userId}`);
    return response.data;
  },

  getNearbyBakers: async (params: NearbyBakersQuery): Promise<NearbyBakersResponse> => {
    const queryParams: Record<string, string> = {
      lat: params.lat.toString(),
      lng: params.lng.toString(),
    };

    if (params.radius !== undefined) {
      queryParams.radius = params.radius.toString();
    }

    if (params.page !== undefined) {
      queryParams.page = params.page.toString();
    }

    if (params.tags) {
      if (Array.isArray(params.tags)) {
        if (params.tags.length > 0) {
          queryParams.tags = params.tags.join(',');
        }
      } else if (params.tags.trim()) {
        queryParams.tags = params.tags.trim();
      }
    }

    const response = await api.get<NearbyBakersResponse>('/baker-profiles', {
      params: queryParams,
    });
    return response.data;
  },

  getMyShowcase: async (): Promise<ShowcaseListResponse> => {
    const response = await api.get<ShowcaseListResponse>('/baker-profiles/me/showcase');
    return response.data;
  },

  addShowcaseRecipe: async (data: AddShowcaseInput): Promise<ShowcaseItemResponse> => {
    const response = await api.post<ShowcaseItemResponse>('/baker-profiles/me/showcase', data);
    return response.data;
  },

  reorderShowcase: async (data: ReorderShowcaseInput): Promise<ShowcaseListResponse> => {
    const response = await api.patch<ShowcaseListResponse>(
      '/baker-profiles/me/showcase/order',
      data,
    );
    return response.data;
  },

  removeShowcaseRecipe: async (recipeId: string): Promise<void> => {
    await api.delete(`/baker-profiles/me/showcase/${recipeId}`);
  },

  getPublicShowcase: async (userId: string): Promise<ShowcaseListResponse> => {
    const response = await api.get<ShowcaseListResponse>(`/baker-profiles/${userId}/showcase`);
    return response.data;
  },
};
