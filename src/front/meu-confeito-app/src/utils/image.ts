import { Alert, Platform } from 'react-native';

import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { API_HOST_URL } from '../config/env';

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const AVATAR_RESTRICTIONS = {
  maxWidth: 300,
  maxHeight: 300,
  aspectRatio: [1, 1] as [number, number],
};

export const RECIPE_COVER_RESTRICTIONS = {
  maxWidth: 1920,
  maxHeight: 1080,
  aspectRatio: [16, 9] as [number, number],
};

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
  mimeType: string;
  fileName: string;
  file?: File;
}

export function getStorageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl || !pathOrUrl.trim()) {
    return '';
  }

  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || trimmed.startsWith('file://')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const urlObj = new URL(trimmed);
      // Normalize any asset pointing to the backend's /storage directory
      if (urlObj.pathname.includes('/storage/')) {
        const storageIndex = urlObj.pathname.indexOf('/storage/');
        const storagePath = urlObj.pathname.slice(storageIndex);
        return `${API_HOST_URL}${storagePath}${urlObj.search}`;
      }

      if (
        (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') &&
        !API_HOST_URL.includes('localhost') &&
        !API_HOST_URL.includes('127.0.0.1')
      ) {
        return `${API_HOST_URL}${urlObj.pathname}${urlObj.search}`;
      }
    } catch {
      // ignore parsing error
    }
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_HOST_URL}${cleanPath}`;
}

export function calculateScaledDimensions(
  currentWidth: number,
  currentHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number; shouldResize: boolean } {
  if (currentWidth <= 0 || currentHeight <= 0) {
    return { width: maxWidth, height: maxHeight, shouldResize: false };
  }

  if (currentWidth <= maxWidth && currentHeight <= maxHeight) {
    return { width: currentWidth, height: currentHeight, shouldResize: false };
  }

  const widthRatio = maxWidth / currentWidth;
  const heightRatio = maxHeight / currentHeight;
  const scalingFactor = Math.min(widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(currentWidth * scalingFactor)),
    height: Math.max(1, Math.round(currentHeight * scalingFactor)),
    shouldResize: true,
  };
}

async function getImageSizeFromUri(uri: string): Promise<number | undefined> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.warn('Unable to determine image size via fetch:', error);
    return undefined;
  }
}

async function processPickedAsset(
  asset: ImagePicker.ImagePickerAsset,
  maxWidth: number,
  maxHeight: number,
  resourceName: string,
): Promise<ProcessedImage | null> {
  try {
    const originalWidth = asset.width || 0;
    const originalHeight = asset.height || 0;

    const {
      width: targetWidth,
      height: targetHeight,
      shouldResize,
    } = calculateScaledDimensions(originalWidth, originalHeight, maxWidth, maxHeight);

    let processedUri = asset.uri;
    let finalWidth = originalWidth;
    let finalHeight = originalHeight;

    if (shouldResize) {
      const manipulationResult = await manipulateAsync(
        asset.uri,
        [{ resize: { width: targetWidth, height: targetHeight } }],
        {
          compress: 0.85,
          format: SaveFormat.WEBP,
        },
      );

      processedUri = manipulationResult.uri;
      finalWidth = manipulationResult.width;
      finalHeight = manipulationResult.height;
    }

    let finalFileSize = asset.fileSize;
    if (shouldResize || !finalFileSize) {
      finalFileSize = await getImageSizeFromUri(processedUri);
    }

    if (finalFileSize && finalFileSize > MAX_IMAGE_FILE_SIZE_BYTES) {
      const currentMb = (finalFileSize / (1024 * 1024)).toFixed(1);
      Alert.alert(
        'Imagem Muito Grande',
        `A imagem selecionada possui ${currentMb}MB. O tamanho máximo permitido para ${resourceName} é de 5MB.`,
      );
      return null;
    }

    const defaultFileName = `${resourceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.webp`;

    return {
      uri: processedUri,
      width: finalWidth,
      height: finalHeight,
      fileSize: finalFileSize,
      mimeType: 'image/webp',
      fileName: asset.fileName?.replace(/\.[^/.]+$/, '.webp') || defaultFileName,
      file: asset.file,
    };
  } catch (error) {
    console.error('Error processing picked image:', error);
    Alert.alert('Erro na Imagem', 'Não foi possível processar a imagem selecionada.');
    return null;
  }
}

export async function pickAvatarImage(): Promise<ProcessedImage | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: AVATAR_RESTRICTIONS.aspectRatio,
      quality: 0.9,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return await processPickedAsset(
      asset,
      AVATAR_RESTRICTIONS.maxWidth,
      AVATAR_RESTRICTIONS.maxHeight,
      'foto de perfil',
    );
  } catch (error) {
    console.error('Error picking avatar image:', error);
    Alert.alert('Erro ao Selecionar', 'Não foi possível abrir a galeria para selecionar a imagem.');
    return null;
  }
}

export async function pickRecipeCoverImage(): Promise<ProcessedImage | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: RECIPE_COVER_RESTRICTIONS.aspectRatio,
      quality: 0.9,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return await processPickedAsset(
      asset,
      RECIPE_COVER_RESTRICTIONS.maxWidth,
      RECIPE_COVER_RESTRICTIONS.maxHeight,
      'capa da receita',
    );
  } catch (error) {
    console.error('Error picking recipe cover image:', error);
    Alert.alert('Erro ao Selecionar', 'Não foi possível abrir a galeria para selecionar a imagem.');
    return null;
  }
}

export async function createImageFormData(
  fieldName: 'avatar' | 'cover',
  image: ProcessedImage,
): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    if (image.file) {
      formData.append(fieldName, image.file);
    } else {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      formData.append(fieldName, blob, image.fileName);
    }
  } else {
    // Native FormData in React Native
    formData.append(fieldName, {
      uri: image.uri,
      name: image.fileName,
      type: image.mimeType,
    } as unknown as Blob);
  }

  return formData;
}
