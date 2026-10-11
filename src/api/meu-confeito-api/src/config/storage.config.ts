import fs from 'node:fs';
import path from 'node:path';

import { env } from './env.config';

export function resolveStorageDirectory(): string {
  const configuredPath = env.STORAGE_PATH;

  if (path.isAbsolute(configuredPath) && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  // Handle case where STORAGE_PATH = "/storage" refers to sibling folder '../storage'
  const siblingPath = path.resolve(process.cwd(), '..', configuredPath.replace(/^\/+/, ''));
  if (fs.existsSync(siblingPath)) {
    return siblingPath;
  }

  const relativePath = path.resolve(process.cwd(), configuredPath);
  if (fs.existsSync(relativePath)) {
    return relativePath;
  }

  // Fallback: sibling folder '../storage'
  const defaultDir = path.resolve(process.cwd(), '../storage');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }

  return defaultDir;
}

export const STORAGE_ROOT = resolveStorageDirectory();
