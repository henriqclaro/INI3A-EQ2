import type { NextFunction, Request, Response } from 'express';

import multer from 'multer';

import { DefaultAppError } from '../responses/http.error';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new DefaultAppError(
          'Only image files (JPEG, PNG, WEBP, GIF, AVIF) are allowed',
          'INVALID_FORMAT',
        ),
      );
    }

    return cb(null, true);
  },
});

export function uploadSingleImage(primaryFieldName: string) {
  const multerMiddleware = upload.fields([
    { name: primaryFieldName, maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);

  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: unknown) => {
      if (err) {
        return next(err);
      }

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const uploadedFile = files?.[primaryFieldName]?.[0] ?? files?.file?.[0];

      if (!uploadedFile) {
        return next(
          new DefaultAppError(
            `Image file is required under field '${primaryFieldName}'`,
            'INVALID_FORMAT',
          ),
        );
      }

      req.file = uploadedFile;
      return next();
    });
  };
}

export const uploadAvatarMiddleware = uploadSingleImage('avatar');
export const uploadCoverMiddleware = uploadSingleImage('cover');
