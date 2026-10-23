import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProfitSummaryData } from '../types/analytics';
import { InventoryItem, TransactionItem, TransactionQueryRequest } from '../types/inventory';
import { ProductionItem, ProductionQueryParams, ProductionTransaction } from '../types/production';

const INVENTORY_STORAGE_KEY = '@meu_confeito_cached_inventory';
const PRODUCTIONS_STORAGE_KEY = '@meu_confeito_cached_productions';
const PROFIT_SUMMARIES_STORAGE_KEY = '@meu_confeito_cached_profit_summaries';
const TRANSACTIONS_STORAGE_KEY = '@meu_confeito_cached_transactions';

const MAX_CACHED_PRODUCTIONS = 50;
const MAX_CACHED_TRANSACTIONS = 100;
const MAX_CACHED_SUMMARIES = 6;
const CANCELED_PRODUCTIONS_MAX_AGE_DAYS = 14;
const SUMMARY_MAX_AGE_DAYS = 30;

interface CachedInventoryWrapper {
  version: number;
  updatedAt: string;
  items: InventoryItem[];
}

interface CachedProductionsWrapper {
  version: number;
  updatedAt: string;
  items: ProductionItem[];
}

interface CachedTransactionsWrapper {
  version: number;
  updatedAt: string;
  items: TransactionItem[];
}

interface CachedSummaryEntry {
  updatedAt: string;
  summary: ProfitSummaryData;
}

interface CachedProfitSummariesWrapper {
  version: number;
  updatedAt: string;
  presets: Record<string, CachedSummaryEntry>;
}

export interface OperationsStorageStats {
  inventoryCount: number;
  productionsCount: number;
  summariesCount: number;
  estimatedBytes: number;
}

// In-Memory L1 Cache
let memoryInventory: InventoryItem[] | null = null;
let isInventoryLoaded = false;

let memoryProductions: ProductionItem[] | null = null;
let isProductionsLoaded = false;

let memoryTransactions: TransactionItem[] | null = null;
let isTransactionsLoaded = false;

let memorySummaries: Map<string, CachedSummaryEntry> | null = null;
let isSummariesLoaded = false;

type OperationsChangeListener = () => void;
const listeners = new Set<OperationsChangeListener>();

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.warn('Error in offline operations listener:', err);
    }
  }
}

// Byte Compaction Helpers
function compactInventoryItem(item: InventoryItem): InventoryItem {
  return {
    ingredientId: item.ingredientId,
    currentQuantity: Number(item.currentQuantity) || 0,
    costPerBaseUnit: Number(item.costPerBaseUnit) || 0,
    expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString() : null,
    lastUpdated: item.lastUpdated
      ? new Date(item.lastUpdated).toISOString()
      : new Date().toISOString(),
    ingredient: {
      id: item.ingredient?.id ?? item.ingredientId,
      name: item.ingredient?.name ?? 'Insumo',
      slug: item.ingredient?.slug ?? '',
      category: item.ingredient?.category ?? '',
      baseDimension: item.ingredient?.baseDimension ?? '',
      baseUnit: item.ingredient?.baseUnit ?? 'un',
      description: item.ingredient?.description ?? null,
    },
  };
}

function compactProductionTransaction(tx: ProductionTransaction): ProductionTransaction {
  return {
    id: tx.id,
    ingredientId: tx.ingredientId,
    transactionType: tx.transactionType,
    quantityChanged: Number(tx.quantityChanged) || 0,
    measurementUnit: tx.measurementUnit,
    unitCost: Number(tx.unitCost) || 0,
    totalCost: Number(tx.totalCost) || 0,
    expirationDate: tx.expirationDate ? new Date(tx.expirationDate).toISOString() : null,
    createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
    ingredient: tx.ingredient
      ? {
          id: tx.ingredient.id,
          name: tx.ingredient.name,
          slug: tx.ingredient.slug,
          baseUnit: tx.ingredient.baseUnit,
        }
      : undefined,
  };
}

function compactTransactionItem(tx: TransactionItem): TransactionItem {
  return {
    id: tx.id,
    userId: tx.userId,
    ingredientId: tx.ingredientId,
    productionId: tx.productionId,
    transactionType: tx.transactionType,
    quantityChanged: Number(tx.quantityChanged) || 0,
    measurementUnit: tx.measurementUnit,
    unitCost: Number(tx.unitCost) || 0,
    totalCost: Number(tx.totalCost) || 0,
    expirationDate: tx.expirationDate ? new Date(tx.expirationDate).toISOString() : null,
    createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
    ingredient: tx.ingredient
      ? {
          id: tx.ingredient.id,
          name: tx.ingredient.name,
          slug: tx.ingredient.slug,
          baseUnit: tx.ingredient.baseUnit,
        }
      : undefined,
    production: tx.production
      ? {
          id: tx.production.id,
          yieldProduced: Number(tx.production.yieldProduced) || 0,
          recipe: {
            id: tx.production.recipe.id,
            title: tx.production.recipe.title,
            yieldUnit: tx.production.recipe.yieldUnit,
          },
        }
      : null,
  };
}

function compactProductionItem(item: ProductionItem): ProductionItem {
  return {
    id: item.id,
    userId: item.userId,
    recipeId: item.recipeId,
    yieldProduced: Number(item.yieldProduced) || 0,
    productionDate: item.productionDate
      ? new Date(item.productionDate).toISOString()
      : new Date().toISOString(),
    expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString() : null,
    canceledAt: item.canceledAt ? new Date(item.canceledAt).toISOString() : null,
    ingredientCost: Number(item.ingredientCost) || 0,
    laborCost: Number(item.laborCost) || 0,
    overheadCost: Number(item.overheadCost) || 0,
    packagingCost: Number(item.packagingCost) || 0,
    totalCost: Number(item.totalCost) || 0,
    unitCost: Number(item.unitCost) || 0,
    recipe: item.recipe
      ? {
          id: item.recipe.id,
          title: item.recipe.title,
          yieldUnit: item.recipe.yieldUnit,
          baseYield: Number(item.recipe.baseYield) || 0,
        }
      : undefined,
    transactions: Array.isArray(item.transactions)
      ? item.transactions.map(compactProductionTransaction)
      : undefined,
  };
}

/**
 * Service managing local offline storage, intelligent byte pruning,
 * and high-performance caching for Inventory, Productions, and Reports.
 */
export const OfflineOperationsService = {
  subscribe(listener: OperationsChangeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // ---------------------------------------------------------------------------
  // INVENTORY
  // ---------------------------------------------------------------------------

  async getInventory(): Promise<InventoryItem[]> {
    if (isInventoryLoaded && memoryInventory !== null) {
      return memoryInventory;
    }

    try {
      const raw = await AsyncStorage.getItem(INVENTORY_STORAGE_KEY);
      if (!raw) {
        memoryInventory = [];
        isInventoryLoaded = true;
        return memoryInventory;
      }

      const parsed = JSON.parse(raw) as CachedInventoryWrapper;
      memoryInventory = Array.isArray(parsed.items) ? parsed.items : [];
      isInventoryLoaded = true;
      return memoryInventory;
    } catch (err) {
      console.warn('Failed to load cached inventory from storage:', err);
      memoryInventory = [];
      isInventoryLoaded = true;
      return memoryInventory;
    }
  },

  getInventoryFast(): InventoryItem[] | null {
    return isInventoryLoaded ? memoryInventory : null;
  },

  async saveInventory(items: InventoryItem[]): Promise<void> {
    if (!Array.isArray(items)) return;

    // Compact items to minimize disk and memory bytes
    const compacted = items.map(compactInventoryItem);
    memoryInventory = compacted;
    isInventoryLoaded = true;

    try {
      const payload: CachedInventoryWrapper = {
        version: 1,
        updatedAt: new Date().toISOString(),
        items: compacted,
      };
      await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(payload));
      notifyListeners();
    } catch (err) {
      console.error('Failed to persist inventory to storage:', err);
    }
  },

  async clearInventory(): Promise<void> {
    memoryInventory = [];
    isInventoryLoaded = true;
    try {
      await AsyncStorage.removeItem(INVENTORY_STORAGE_KEY);
      notifyListeners();
    } catch (err) {
      console.error('Failed to clear inventory from storage:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // PRODUCTIONS (With Intelligent Pruning)
  // ---------------------------------------------------------------------------

  async getProductions(params?: ProductionQueryParams): Promise<ProductionItem[]> {
    let allProductions: ProductionItem[] = [];

    if (isProductionsLoaded && memoryProductions !== null) {
      allProductions = memoryProductions;
    } else {
      try {
        const raw = await AsyncStorage.getItem(PRODUCTIONS_STORAGE_KEY);
        if (!raw) {
          memoryProductions = [];
          isProductionsLoaded = true;
          allProductions = [];
        } else {
          const parsed = JSON.parse(raw) as CachedProductionsWrapper;
          memoryProductions = Array.isArray(parsed.items) ? parsed.items : [];
          isProductionsLoaded = true;
          allProductions = memoryProductions;
        }
      } catch (err) {
        console.warn('Failed to load cached productions from storage:', err);
        memoryProductions = [];
        isProductionsLoaded = true;
        allProductions = [];
      }
    }

    // Apply client-side filtering when offline
    let filtered = allProductions;

    if (!params?.includeCanceled) {
      filtered = filtered.filter((item) => !item.canceledAt);
    }

    if (params?.recipeId) {
      filtered = filtered.filter((item) => item.recipeId === params.recipeId);
    }

    return filtered;
  },

  getProductionsFast(params?: ProductionQueryParams): ProductionItem[] | null {
    if (!isProductionsLoaded || memoryProductions === null) return null;

    let filtered = memoryProductions;
    if (!params?.includeCanceled) {
      filtered = filtered.filter((item) => !item.canceledAt);
    }
    if (params?.recipeId) {
      filtered = filtered.filter((item) => item.recipeId === params.recipeId);
    }
    return filtered;
  },

  async getSingleProduction(id: string): Promise<ProductionItem | null> {
    const list = await this.getProductions({ includeCanceled: true });
    return list.find((p) => p.id === id) ?? null;
  },

  /**
   * Saves productions and executes intelligent pruning:
   * 1. Compacts nested properties to essential fields.
   * 2. Prunes obsolete cancelled productions older than 14 days.
   * 3. Sorts by date descending and retains the top 50 entries to cap storage.
   */
  async saveProductions(items: ProductionItem[]): Promise<void> {
    if (!Array.isArray(items)) return;

    const now = Date.now();
    const canceledMaxAgeMs = CANCELED_PRODUCTIONS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    // Prune obsolete cancelled items
    const validItems = items.filter((item) => {
      if (item.canceledAt) {
        const canceledTime = new Date(item.canceledAt).getTime();
        const hasExpiredCancel = !isNaN(canceledTime) && now - canceledTime > canceledMaxAgeMs;
        if (hasExpiredCancel) {
          return false;
        }
      }
      return true;
    });

    // Compact and sort by productionDate descending
    const compacted = validItems
      .map(compactProductionItem)
      .sort((a, b) => new Date(b.productionDate).getTime() - new Date(a.productionDate).getTime())
      // Retain maximum N items to prevent unbounded byte growth
      .slice(0, MAX_CACHED_PRODUCTIONS);

    memoryProductions = compacted;
    isProductionsLoaded = true;

    try {
      const payload: CachedProductionsWrapper = {
        version: 1,
        updatedAt: new Date().toISOString(),
        items: compacted,
      };
      await AsyncStorage.setItem(PRODUCTIONS_STORAGE_KEY, JSON.stringify(payload));
      notifyListeners();
    } catch (err) {
      console.error('Failed to persist productions to storage:', err);
    }
  },

  async clearProductions(): Promise<void> {
    memoryProductions = [];
    isProductionsLoaded = true;
    try {
      await AsyncStorage.removeItem(PRODUCTIONS_STORAGE_KEY);
      notifyListeners();
    } catch (err) {
      console.error('Failed to clear productions from storage:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // INVENTORY TRANSACTIONS
  // ---------------------------------------------------------------------------

  async getTransactions(query?: TransactionQueryRequest): Promise<TransactionItem[]> {
    let allTransactions: TransactionItem[] = [];

    if (isTransactionsLoaded && memoryTransactions !== null) {
      allTransactions = memoryTransactions;
    } else {
      try {
        const raw = await AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY);
        if (!raw) {
          memoryTransactions = [];
          isTransactionsLoaded = true;
          allTransactions = [];
        } else {
          const parsed = JSON.parse(raw) as CachedTransactionsWrapper;
          memoryTransactions = Array.isArray(parsed.items) ? parsed.items : [];
          isTransactionsLoaded = true;
          allTransactions = memoryTransactions;
        }
      } catch (err) {
        console.warn('Failed to load cached transactions from storage:', err);
        memoryTransactions = [];
        isTransactionsLoaded = true;
        allTransactions = [];
      }
    }

    let filtered = allTransactions;
    if (query?.transactionType) {
      filtered = filtered.filter((item) => item.transactionType === query.transactionType);
    }
    if (query?.ingredientId) {
      filtered = filtered.filter((item) => item.ingredientId === query.ingredientId);
    }
    return filtered;
  },

  getTransactionsFast(query?: TransactionQueryRequest): TransactionItem[] | null {
    if (!isTransactionsLoaded || memoryTransactions === null) return null;

    let filtered = memoryTransactions;
    if (query?.transactionType) {
      filtered = filtered.filter((item) => item.transactionType === query.transactionType);
    }
    if (query?.ingredientId) {
      filtered = filtered.filter((item) => item.ingredientId === query.ingredientId);
    }
    return filtered;
  },

  async saveTransactions(items: TransactionItem[]): Promise<void> {
    if (!Array.isArray(items)) return;

    const compacted = items
      .map(compactTransactionItem)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_CACHED_TRANSACTIONS);

    memoryTransactions = compacted;
    isTransactionsLoaded = true;

    try {
      const payload: CachedTransactionsWrapper = {
        version: 1,
        updatedAt: new Date().toISOString(),
        items: compacted,
      };
      await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(payload));
      notifyListeners();
    } catch (err) {
      console.error('Failed to persist transactions to storage:', err);
    }
  },

  async clearTransactions(): Promise<void> {
    memoryTransactions = [];
    isTransactionsLoaded = true;
    try {
      await AsyncStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      notifyListeners();
    } catch (err) {
      console.error('Failed to clear transactions from storage:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // PROFIT SUMMARIES / REPORTS (With Expiration Pruning)
  // ---------------------------------------------------------------------------

  async getProfitSummary(preset: string): Promise<ProfitSummaryData | null> {
    await this.ensureSummariesLoaded();
    const entry = memorySummaries?.get(preset);
    if (!entry) return null;

    // Verify freshness limit (30 days)
    const ageMs = Date.now() - new Date(entry.updatedAt).getTime();
    const maxAgeMs = SUMMARY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      memorySummaries?.delete(preset);
      return null;
    }

    return entry.summary;
  },

  getProfitSummaryFast(preset: string): ProfitSummaryData | null {
    if (!isSummariesLoaded || !memorySummaries) return null;
    return memorySummaries.get(preset)?.summary ?? null;
  },

  async saveProfitSummary(preset: string, summary: ProfitSummaryData): Promise<void> {
    if (!preset || !summary) return;

    await this.ensureSummariesLoaded();
    if (!memorySummaries) {
      memorySummaries = new Map<string, CachedSummaryEntry>();
    }

    // Insert or update summary
    memorySummaries.set(preset, {
      updatedAt: new Date().toISOString(),
      summary,
    });

    // Prune entries exceeding max limit, discarding oldest non-standard presets
    const standardPresets = new Set(['7d', '15d', '30d', 'month']);
    if (memorySummaries.size > MAX_CACHED_SUMMARIES) {
      for (const [key] of memorySummaries) {
        if (!standardPresets.has(key)) {
          memorySummaries.delete(key);
          if (memorySummaries.size <= MAX_CACHED_SUMMARIES) break;
        }
      }
    }

    try {
      const record: Record<string, CachedSummaryEntry> = {};
      for (const [key, value] of memorySummaries.entries()) {
        record[key] = value;
      }
      const payload: CachedProfitSummariesWrapper = {
        version: 1,
        updatedAt: new Date().toISOString(),
        presets: record,
      };
      await AsyncStorage.setItem(PROFIT_SUMMARIES_STORAGE_KEY, JSON.stringify(payload));
      notifyListeners();
    } catch (err) {
      console.error('Failed to persist profit summary to storage:', err);
    }
  },

  async clearProfitSummaries(): Promise<void> {
    memorySummaries = new Map();
    isSummariesLoaded = true;
    try {
      await AsyncStorage.removeItem(PROFIT_SUMMARIES_STORAGE_KEY);
      notifyListeners();
    } catch (err) {
      console.error('Failed to clear profit summaries from storage:', err);
    }
  },

  async ensureSummariesLoaded(): Promise<void> {
    if (isSummariesLoaded && memorySummaries !== null) return;

    try {
      const raw = await AsyncStorage.getItem(PROFIT_SUMMARIES_STORAGE_KEY);
      if (!raw) {
        memorySummaries = new Map();
        isSummariesLoaded = true;
        return;
      }

      const parsed = JSON.parse(raw) as CachedProfitSummariesWrapper;
      memorySummaries = new Map(Object.entries(parsed.presets ?? {}));
      isSummariesLoaded = true;
    } catch (err) {
      console.warn('Failed to load profit summaries from storage:', err);
      memorySummaries = new Map();
      isSummariesLoaded = true;
    }
  },

  // ---------------------------------------------------------------------------
  // GLOBAL STORAGE MANAGEMENT & STATS
  // ---------------------------------------------------------------------------

  async clearAllOperationsData(): Promise<{ isSuccess: boolean; clearedCount: number }> {
    try {
      const prevStats = await this.getOperationsStorageStats();
      const totalCount =
        prevStats.inventoryCount + prevStats.productionsCount + prevStats.summariesCount;

      memoryInventory = [];
      isInventoryLoaded = true;

      memoryProductions = [];
      isProductionsLoaded = true;

      memoryTransactions = [];
      isTransactionsLoaded = true;

      memorySummaries = new Map();
      isSummariesLoaded = true;

      await AsyncStorage.multiRemove([
        INVENTORY_STORAGE_KEY,
        PRODUCTIONS_STORAGE_KEY,
        TRANSACTIONS_STORAGE_KEY,
        PROFIT_SUMMARIES_STORAGE_KEY,
      ]);

      notifyListeners();
      return { isSuccess: true, clearedCount: totalCount };
    } catch (err) {
      console.error('Failed to clear all operations offline data:', err);
      return { isSuccess: false, clearedCount: 0 };
    }
  },

  async getOperationsStorageStats(): Promise<OperationsStorageStats> {
    const inv = await this.getInventory();
    const prod = await this.getProductions({ includeCanceled: true });
    await this.ensureSummariesLoaded();
    const sumCount = memorySummaries ? memorySummaries.size : 0;

    let estimatedBytes = 0;
    try {
      const [rawInv, rawProd, rawSum] = await Promise.all([
        AsyncStorage.getItem(INVENTORY_STORAGE_KEY),
        AsyncStorage.getItem(PRODUCTIONS_STORAGE_KEY),
        AsyncStorage.getItem(PROFIT_SUMMARIES_STORAGE_KEY),
      ]);
      if (rawInv) estimatedBytes += rawInv.length * 2;
      if (rawProd) estimatedBytes += rawProd.length * 2;
      if (rawSum) estimatedBytes += rawSum.length * 2;
    } catch {
      // Fallback rough estimate
      estimatedBytes = inv.length * 250 + prod.length * 600 + sumCount * 400;
    }

    return {
      inventoryCount: inv.length,
      productionsCount: prod.length,
      summariesCount: sumCount,
      estimatedBytes,
    };
  },
};
