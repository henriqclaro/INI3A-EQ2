import { Prisma } from '../generated/prisma/client';

export type DecimalValue = Prisma.Decimal | number | string;

/**
 * Calculates the Weighted Average Cost (Preço Médio Ponderado - PMP) for an inventory item.
 *
 * Formula:
 * NewCost = ((Q_current * C_current) + (Q_purchased * C_unit_purchase)) / (Q_current + Q_purchased)
 *
 * Edge cases:
 * - If Q_current <= 0, the new unit cost strictly equals C_unit_purchase.
 * - Round/format to 6 decimal places (@db.Decimal(12, 6)).
 */
export function calculateWeightedAverageCost(
  currentQuantity: DecimalValue,
  currentCost: DecimalValue,
  purchasedQuantity: DecimalValue,
  purchasedUnitCost: DecimalValue,
): Prisma.Decimal {
  const qCurrent = new Prisma.Decimal(currentQuantity);
  const cCurrent = new Prisma.Decimal(currentCost);
  const qPurchased = new Prisma.Decimal(purchasedQuantity);
  const cPurchase = new Prisma.Decimal(purchasedUnitCost);

  if (qCurrent.lte(0)) {
    return cPurchase.toDecimalPlaces(6);
  }

  const currentTotal = qCurrent.times(cCurrent);
  const purchaseTotal = qPurchased.times(cPurchase);
  const totalQuantity = qCurrent.plus(qPurchased);

  if (totalQuantity.lte(0)) {
    return cPurchase.toDecimalPlaces(6);
  }

  const newCost = currentTotal.plus(purchaseTotal).dividedBy(totalQuantity);
  return newCost.toDecimalPlaces(6);
}
