import prisma from '../config/database';
import { Prisma } from '../generated/prisma/client';
import {
  ConflictError,
  DefaultAppError,
  ForbiddenError,
  GoneError,
  NotFoundError,
} from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { BakerProfileDTO } from '../types/dtos/baker-profile.dto';

export class BakerProfileService {
  private parseLocation(rawLocation: any) {
    if (rawLocation?.coordinates && Array.isArray(rawLocation.coordinates)) {
      const [longitude, latitude] = rawLocation.coordinates;
      return { latitude, longitude };
    }

    return null;
  }

  private parseTags(rawTags: unknown): BakerProfileDTO.BakerTag[] {
    const parsed = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string'
        ? JSON.parse(rawTags)
        : [];

    return parsed.map((t: { id: number; name: string }) => ({
      id: Number(t.id),
      name: String(t.name),
    }));
  }

  private async validateUserTagIds(tagIds: number[]): Promise<number[]> {
    const uniqueTagIds = Array.from(new Set(tagIds));

    if (uniqueTagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { id: { in: uniqueTagIds } },
        select: { id: true, type: true },
      });

      if (existingTags.length !== uniqueTagIds.length) {
        throw new NotFoundError('One or more tags not found', 'RESOURCE_NOT_FOUND');
      }

      const invalidTypeTag = existingTags.find((tag) => tag.type !== 'USER');
      if (invalidTypeTag) {
        throw new DefaultAppError('All tags must be of type USER', 'INVALID_FORMAT');
      }
    }

    return uniqueTagIds;
  }

  async create(
    context: RequestContext,
    data: BakerProfileDTO.RegisterRequest,
  ): Promise<BakerProfileDTO.ProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: {
        id: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    if (user.role !== 'BAKER') {
      throw new ForbiddenError(
        'Only users with BAKER role can create a baker profile',
        'AUTH_INSUFFICIENT_PERMISSIONS',
      );
    }

    if (!user.phone) {
      throw new ForbiddenError(
        'A registered phone number is required to create a baker profile',
        'USER_PHONE_NUMBER_REQUIRED',
      );
    }

    const existingProfile = await prisma.bakerProfile.findUnique({
      where: { userId: context.userId },
    });

    if (existingProfile) {
      throw new ConflictError('Baker profile already exists', 'RESOURCE_ALREADY_EXISTS');
    }

    const incomingTagIds = data.tagIds !== undefined ? data.tagIds : data.tags;
    let uniqueTagIds: number[] | undefined;

    if (incomingTagIds !== undefined) {
      uniqueTagIds = await this.validateUserTagIds(incomingTagIds);
    }

    await prisma.$transaction(async (tx) => {
      await tx.bakerProfile.create({
        data: {
          userId: context.userId,
          bio: data.bio ?? null,
          instagram: data.instagram ?? null,
          neighborhood: data.neighborhood ?? null,
          city: data.city ?? null,
        },
      });

      if (data.location) {
        await tx.$executeRaw`
          UPDATE "baker_profile"
          SET
            location = ST_SetSRID(ST_MakePoint(${data.location.longitude}, ${data.location.latitude}), 4326),
            updated_at = NOW()
          WHERE user_id = ${context.userId}
        `;
      }

      if (uniqueTagIds && uniqueTagIds.length > 0) {
        await tx.userTag.createMany({
          data: uniqueTagIds.map((tagId) => ({
            userId: context.userId,
            tagId,
          })),
        });
      }
    });

    return this.selectMe(context);
  }

  async selectMe(context: RequestContext): Promise<BakerProfileDTO.ProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { isActive: true },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    // eslint-disable-next-line @ts-safeql/check-sql
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        "user".id as "userId",
        "user".name,
        "user".email,
        "user".phone,
        "user".profile_picture_url as "pfpUrl",
        bp.bio,
        bp.instagram,
        bp.neighborhood,
        bp.city,
        bp.created_at as "createdAt",
        bp.updated_at as "updatedAt",
        ST_AsGeoJSON(bp.location)::json as location,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name) ORDER BY t.id ASC)
            FROM "user_tag" ut
            INNER JOIN "tag" t ON t.id = ut.tag_id
            WHERE ut.user_id = bp.user_id
          ),
          '[]'::json
        ) as tags
      FROM "baker_profile" bp
      INNER JOIN "user" ON "user".id = bp.user_id
      WHERE bp.user_id = ${context.userId}
      LIMIT 1
    `;

    const rawProfile = result[0] || null;

    if (!rawProfile) {
      throw new NotFoundError('Baker profile not found', 'RESOURCE_NOT_FOUND');
    }

    return {
      bakerProfile: {
        userId: rawProfile.userId,
        name: rawProfile.name,
        email: rawProfile.email,
        phone: rawProfile.phone,
        pfpUrl: rawProfile.pfpUrl,
        bio: rawProfile.bio,
        instagram: rawProfile.instagram,
        neighborhood: rawProfile.neighborhood,
        city: rawProfile.city,
        location: this.parseLocation(rawProfile.location),
        tags: this.parseTags(rawProfile.tags),
        createdAt: rawProfile.createdAt,
        updatedAt: rawProfile.updatedAt,
      },
    };
  }

  async updateMe(
    context: RequestContext,
    data: BakerProfileDTO.UpdateRequest,
  ): Promise<BakerProfileDTO.ProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { isActive: true },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    const existingProfile = await prisma.bakerProfile.findUnique({
      where: { userId: context.userId },
    });

    if (!existingProfile) {
      throw new NotFoundError('Baker profile not found', 'RESOURCE_NOT_FOUND');
    }

    const incomingTagIds = data.tagIds !== undefined ? data.tagIds : data.tags;
    let uniqueTagIds: number[] | undefined;

    if (incomingTagIds !== undefined) {
      uniqueTagIds = await this.validateUserTagIds(incomingTagIds);
    }

    const { location, bio, instagram, neighborhood, city } = data;

    const profileData = {
      ...(bio !== undefined && { bio }),
      ...(instagram !== undefined && { instagram }),
      ...(neighborhood !== undefined && { neighborhood }),
      ...(city !== undefined && { city }),
    };

    await prisma.$transaction(async (tx) => {
      if (Object.keys(profileData).length > 0) {
        await tx.bakerProfile.update({
          where: { userId: context.userId },
          data: profileData,
        });
      } else if (uniqueTagIds !== undefined && location === undefined) {
        await tx.bakerProfile.update({
          where: { userId: context.userId },
          data: { updatedAt: new Date() },
        });
      }

      if (location !== undefined) {
        if (location === null) {
          await tx.$executeRaw`
            UPDATE "baker_profile"
            SET location = NULL, updated_at = NOW()
            WHERE user_id = ${context.userId}
          `;
        } else {
          await tx.$executeRaw`
            UPDATE "baker_profile"
            SET
              location = ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326),
              updated_at = NOW()
            WHERE user_id = ${context.userId}
          `;
        }
      }

      if (uniqueTagIds !== undefined) {
        await tx.userTag.deleteMany({
          where: { userId: context.userId },
        });

        if (uniqueTagIds.length > 0) {
          await tx.userTag.createMany({
            data: uniqueTagIds.map((tagId) => ({
              userId: context.userId,
              tagId,
            })),
          });
        }
      }
    });

    return this.selectMe(context);
  }

  async deleteMe(context: RequestContext): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { isActive: true },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    const existingProfile = await prisma.bakerProfile.findUnique({
      where: { userId: context.userId },
    });

    if (!existingProfile) {
      throw new NotFoundError('Baker profile not found', 'RESOURCE_NOT_FOUND');
    }

    await prisma.bakerProfile.delete({
      where: { userId: context.userId },
    });
  }

  async selectPublic(
    context: RequestContext,
    id: string,
  ): Promise<BakerProfileDTO.PublicProfileResponse> {
    const sender = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { isActive: true },
    });

    if (!sender) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!sender.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    const profile = await prisma.bakerProfile.findUnique({
      where: { userId: id },
      select: {
        userId: true,
        bio: true,
        instagram: true,
        neighborhood: true,
        city: true,
        user: {
          select: {
            name: true,
            phone: true,
            pfpUrl: true,
            isActive: true,
          },
        },
        profileTags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            tagId: 'asc',
          },
        },
      },
    });

    if (!profile || !profile.user.isActive) {
      throw new NotFoundError('Baker profile not found', 'RESOURCE_NOT_FOUND');
    }

    return {
      bakerProfile: {
        userId: profile.userId,
        name: profile.user.name,
        pfpUrl: profile.user.pfpUrl,
        phone: profile.user.phone,
        bio: profile.bio,
        instagram: profile.instagram,
        neighborhood: profile.neighborhood,
        city: profile.city,
        tags: profile.profileTags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
        })),
      },
    };
  }

  async selectByLocation(
    context: RequestContext,
    data: BakerProfileDTO.QueryRequest,
  ): Promise<BakerProfileDTO.SelectByLocationResponse> {
    const sender = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { isActive: true },
    });

    if (!sender) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!sender.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    const limit = 10;
    const safePage = data.page ?? 0;
    const offset = safePage > 0 ? safePage * limit : 0;

    let tagCondition = Prisma.empty;
    if (data.tags && data.tags.length > 0) {
      const numericTagIds = data.tags
        .map((t) => parseInt(t, 10))
        .filter((n) => !isNaN(n) && Number.isInteger(n));
      const tagNames = data.tags.map((t) => t.toLowerCase());

      tagCondition = Prisma.sql`AND EXISTS (
        SELECT 1
        FROM "user_tag" ut
        JOIN "tag" t ON t.id = ut.tag_id
        WHERE ut.user_id = bp.user_id
          AND (
            ${numericTagIds.length > 0 ? Prisma.sql`ut.tag_id = ANY(${numericTagIds}) OR ` : Prisma.empty}LOWER(t.name) = ANY(${tagNames})
          )
      )`;
    }

    /* eslint-disable @ts-safeql/check-sql */
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        bp.user_id as "userId",
        "user".name,
        "user".profile_picture_url as "pfpUrl",
        bp.neighborhood,
        bp.city,
        ROUND(ST_Distance(bp.location::geography, ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)::geography)::numeric, 2)::float as distance,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name) ORDER BY t.id ASC)
            FROM "user_tag" ut
            INNER JOIN "tag" t ON t.id = ut.tag_id
            WHERE ut.user_id = bp.user_id
          ),
          '[]'::json
        ) as tags
      FROM "baker_profile" bp
      INNER JOIN "user" ON "user".id = bp.user_id
      WHERE "user".is_active = true
        AND bp.location IS NOT NULL
        AND ST_DWithin(bp.location::geography, ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)::geography, ${data.radius})
        ${tagCondition}
      ORDER BY distance ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    /* eslint-enable @ts-safeql/check-sql */

    const bakerProfiles = result.map((row) => ({
      userId: row.userId,
      name: row.name,
      pfpUrl: row.pfpUrl,
      distance: Number(row.distance),
      neighborhood: row.neighborhood,
      city: row.city,
      tags: this.parseTags(row.tags),
    }));

    return { bakerProfiles };
  }
}
