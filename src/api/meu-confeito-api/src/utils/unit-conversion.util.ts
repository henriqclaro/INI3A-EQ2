import type { StandardUnit, UnitDimension } from '../generated/prisma/client';

export const UNIT_DIMENSION_MAP: Record<
  UnitDimension,
  {
    baseUnit: StandardUnit;
    units: Partial<Record<StandardUnit, number>>;
  }
> = {
  MASS: {
    baseUnit: 'G',
    units: {
      G: 1,
      KG: 1000,
    },
  },
  VOLUME: {
    baseUnit: 'ML',
    units: {
      ML: 1,
      L: 1000,
    },
  },
  COUNT: {
    baseUnit: 'UN',
    units: {
      UN: 1,
    },
  },
};

export const UNIT_TO_DIMENSION_MAP: Record<
  StandardUnit,
  { dimension: UnitDimension; multiplierToBase: number }
> = {
  G: { dimension: 'MASS', multiplierToBase: 1 },
  KG: { dimension: 'MASS', multiplierToBase: 1000 },
  ML: { dimension: 'VOLUME', multiplierToBase: 1 },
  L: { dimension: 'VOLUME', multiplierToBase: 1000 },
  UN: { dimension: 'COUNT', multiplierToBase: 1 },
};

export function isUnitCompatibleWithDimension(
  unit: StandardUnit,
  dimension: UnitDimension,
): boolean {
  return UNIT_TO_DIMENSION_MAP[unit]?.dimension === dimension;
}

export function convertToBaseUnit(quantity: number, unit: StandardUnit): number {
  const mapping = UNIT_TO_DIMENSION_MAP[unit];
  if (!mapping) {
    throw new Error(`Unsupported unit: ${unit}`);
  }
  return quantity * mapping.multiplierToBase;
}
