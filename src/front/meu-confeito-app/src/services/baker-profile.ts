import {
  BakerProfile,
  BakerProfileRegisterInput,
  BakerProfileUpdateInput,
  PublicBakerProfile,
} from '../types/baker-profile';
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
};
