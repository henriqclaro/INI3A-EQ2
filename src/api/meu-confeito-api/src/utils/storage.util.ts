import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import { STORAGE_ROOT } from '../config/storage.config';
import { DefaultAppError, NotFoundError } from '../responses/http.error';

export async function saveUserAvatar(userId: string, buffer: Buffer): Promise<string> {
  const targetDir = path.join(STORAGE_ROOT, 'users', userId);
  const targetFile = path.join(targetDir, 'avatar.webp');

  await fs.promises.mkdir(targetDir, { recursive: true });

  try {
    await sharp(buffer).rotate().webp({ quality: 80 }).toFile(targetFile);
  } catch {
    throw new DefaultAppError('Invalid or corrupted image file', 'INVALID_FORMAT');
  }

  return `/storage/users/${userId}/avatar.webp`;
}

export async function deleteUserAvatar(userId: string): Promise<void> {
  const targetFile = path.join(STORAGE_ROOT, 'users', userId, 'avatar.webp');

  if (!fs.existsSync(targetFile)) {
    throw new NotFoundError('Avatar image not found', 'RESOURCE_NOT_FOUND');
  }

  await fs.promises.unlink(targetFile);
}

export async function deleteUserAvatarSafely(userId: string): Promise<void> {
  const targetDir = path.join(STORAGE_ROOT, 'users', userId);
  const targetFile = path.join(targetDir, 'avatar.webp');

  if (fs.existsSync(targetFile)) {
    await fs.promises.unlink(targetFile);
  }

  if (fs.existsSync(targetDir)) {
    try {
      await fs.promises.rmdir(targetDir);
    } catch {
      // directory not empty or busy, safely ignore
    }
  }
}

export async function saveRecipeCover(recipeId: string, buffer: Buffer): Promise<string> {
  const targetDir = path.join(STORAGE_ROOT, 'recipes', recipeId);
  const targetFile = path.join(targetDir, 'cover.webp');

  await fs.promises.mkdir(targetDir, { recursive: true });

  try {
    await sharp(buffer).rotate().webp({ quality: 80 }).toFile(targetFile);
  } catch {
    throw new DefaultAppError('Invalid or corrupted image file', 'INVALID_FORMAT');
  }

  return `/storage/recipes/${recipeId}/cover.webp`;
}

export async function deleteRecipeCover(recipeId: string): Promise<void> {
  const targetFile = path.join(STORAGE_ROOT, 'recipes', recipeId, 'cover.webp');

  if (!fs.existsSync(targetFile)) {
    throw new NotFoundError('Recipe cover image not found', 'RESOURCE_NOT_FOUND');
  }

  await fs.promises.unlink(targetFile);
}

export async function deleteRecipeCoverSafely(recipeId: string): Promise<void> {
  const targetDir = path.join(STORAGE_ROOT, 'recipes', recipeId);
  const targetFile = path.join(targetDir, 'cover.webp');

  if (fs.existsSync(targetFile)) {
    await fs.promises.unlink(targetFile);
  }

  if (fs.existsSync(targetDir)) {
    try {
      await fs.promises.rmdir(targetDir);
    } catch {
      // directory not empty or busy, safely ignore
    }
  }
}
