import AsyncStorage from '@react-native-async-storage/async-storage';

const MB = 1024 * 1024;
const DEFAULT_CACHE_TTL = 6 * 60 * 60 * 1000; // 6h fallback for malformed entries.
const MAINTENANCE_MIN_INTERVAL = 2 * 60 * 1000; // Avoid heavy scans on every write.
const DEFAULT_SWEEP_INTERVAL = 15 * 60 * 1000;

const CACHE_NAMESPACE_CONFIG = {
  TMDB: {
    prefixes: ['TMDB_'],
    maxBytes: 6 * MB,
    maxEntries: 220,
  },
  RAWG: {
    prefixes: [
      'RAWG_',
      'TRENDING:',
      'POPULAR:',
      'NEW_RELEASES:',
      'UPCOMING:',
      'GAME_DETAILS:',
      'SCREENSHOTS:',
      'ACHIEVEMENTS:',
      'SERIES:',
      'SEARCH:',
      'GENRES:',
      'PLATFORMS:',
      'STORES:',
    ],
    maxBytes: 7 * MB,
    maxEntries: 260,
  },
  IGDB: {
    prefixes: ['IGDB_'],
    maxBytes: 8 * MB,
    maxEntries: 260,
  },
  NEWS: {
    prefixes: ['NEWS_CACHE:'],
    maxBytes: 2 * MB,
    maxEntries: 50,
  },
};

const GLOBAL_BUDGET_BYTES = 20 * MB;

let sweepIntervalId = null;
let maintenancePromise = null;
let lastMaintenanceAt = 0;

const allCachePrefixes = Object.values(CACHE_NAMESPACE_CONFIG)
  .flatMap((config) => config.prefixes);

const getBytes = (value) => {
  if (typeof value !== 'string') {
    return 0;
  }
  try {
    return new TextEncoder().encode(value).length;
  } catch {
    return value.length;
  }
};

const keyMatchesPrefix = (key, prefix) => key.startsWith(prefix);

const getNamespaceForKey = (key) => {
  for (const [namespace, config] of Object.entries(CACHE_NAMESPACE_CONFIG)) {
    if (config.prefixes.some((prefix) => keyMatchesPrefix(key, prefix))) {
      return namespace;
    }
  }
  return 'MISC';
};

const isTrackedCacheKey = (key) => allCachePrefixes.some((prefix) => keyMatchesPrefix(key, prefix));

const parseEntry = (key, rawValue) => {
  try {
    const parsed = JSON.parse(rawValue);
    const hasWrappedShape =
      parsed &&
      typeof parsed === 'object' &&
      Object.prototype.hasOwnProperty.call(parsed, 'data') &&
      typeof parsed.timestamp === 'number';

    if (hasWrappedShape) {
      return {
        key,
        data: parsed.data,
        timestamp: parsed.timestamp,
        ttl: typeof parsed.ttl === 'number' ? parsed.ttl : null,
        lastAccessed:
          typeof parsed.lastAccessed === 'number' ? parsed.lastAccessed : parsed.timestamp,
        namespace: parsed.namespace || getNamespaceForKey(key),
        rawValue,
        bytes: getBytes(key) + getBytes(rawValue),
      };
    }

    // Legacy fallback: if entry was stored directly, retain data with default metadata.
    return {
      key,
      data: parsed,
      timestamp: Date.now(),
      ttl: DEFAULT_CACHE_TTL,
      lastAccessed: Date.now(),
      namespace: getNamespaceForKey(key),
      rawValue,
      bytes: getBytes(key) + getBytes(rawValue),
    };
  } catch {
    return null;
  }
};

const removeKeys = async (keys) => {
  if (!keys.length) return;
  await AsyncStorage.multiRemove([...new Set(keys)]);
};

const collectEntries = async () => {
  const keys = (await AsyncStorage.getAllKeys()).filter(isTrackedCacheKey);
  if (keys.length === 0) {
    return [];
  }
  const rows = await AsyncStorage.multiGet(keys);

  const entries = [];
  const invalidKeys = [];
  for (const [key, rawValue] of rows) {
    if (!rawValue) continue;
    const parsed = parseEntry(key, rawValue);
    if (!parsed) {
      invalidKeys.push(key);
      continue;
    }
    entries.push(parsed);
  }

  if (invalidKeys.length) {
    await removeKeys(invalidKeys);
  }

  return entries;
};

const enforceNamespaceBudget = (entries, namespace, budgetConfig) => {
  const sorted = [...entries].sort(
    (a, b) => (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp)
  );

  let bytes = sorted.reduce((sum, entry) => sum + entry.bytes, 0);
  const keysToRemove = [];

  while (
    sorted.length > 0 &&
    (bytes > budgetConfig.maxBytes || sorted.length > budgetConfig.maxEntries)
  ) {
    const oldest = sorted.shift();
    bytes -= oldest.bytes;
    keysToRemove.push(oldest.key);
  }

  return {
    namespace,
    keysToRemove,
    remainingEntries: sorted,
    remainingBytes: Math.max(0, bytes),
  };
};

const enforceGlobalBudget = (entries) => {
  const sorted = [...entries].sort(
    (a, b) => (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp)
  );
  let bytes = sorted.reduce((sum, entry) => sum + entry.bytes, 0);
  const keysToRemove = [];

  while (sorted.length > 0 && bytes > GLOBAL_BUDGET_BYTES) {
    const oldest = sorted.shift();
    bytes -= oldest.bytes;
    keysToRemove.push(oldest.key);
  }

  return {
    keysToRemove,
    remainingBytes: Math.max(0, bytes),
  };
};

const runMaintenanceInternal = async () => {
  const now = Date.now();
  const entries = await collectEntries();
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalBytes: 0,
      removed: { stale: 0, budget: 0, global: 0 },
      byNamespace: {},
    };
  }

  const staleKeys = [];
  const activeEntries = [];
  for (const entry of entries) {
    const ttl = typeof entry.ttl === 'number' ? entry.ttl : null;
    if (ttl && now - entry.timestamp > ttl) {
      staleKeys.push(entry.key);
    } else {
      activeEntries.push(entry);
    }
  }

  if (staleKeys.length) {
    await removeKeys(staleKeys);
  }

  const grouped = activeEntries.reduce((acc, entry) => {
    const namespace = entry.namespace || getNamespaceForKey(entry.key);
    if (!acc[namespace]) acc[namespace] = [];
    acc[namespace].push(entry);
    return acc;
  }, {});

  const namespaceBudgetKeys = [];
  const namespaceSnapshot = {};
  let postNamespaceEntries = [];

  for (const [namespace, groupedEntries] of Object.entries(grouped)) {
    const config = CACHE_NAMESPACE_CONFIG[namespace];
    if (!config) {
      postNamespaceEntries = postNamespaceEntries.concat(groupedEntries);
      namespaceSnapshot[namespace] = {
        entries: groupedEntries.length,
        bytes: groupedEntries.reduce((sum, item) => sum + item.bytes, 0),
      };
      continue;
    }

    const budgetResult = enforceNamespaceBudget(groupedEntries, namespace, config);
    namespaceBudgetKeys.push(...budgetResult.keysToRemove);
    postNamespaceEntries = postNamespaceEntries.concat(budgetResult.remainingEntries);
    namespaceSnapshot[namespace] = {
      entries: budgetResult.remainingEntries.length,
      bytes: budgetResult.remainingBytes,
    };
  }

  if (namespaceBudgetKeys.length) {
    await removeKeys(namespaceBudgetKeys);
  }

  const globalBudgetResult = enforceGlobalBudget(postNamespaceEntries);
  if (globalBudgetResult.keysToRemove.length) {
    await removeKeys(globalBudgetResult.keysToRemove);
  }

  const bytesAfterPrune = globalBudgetResult.remainingBytes;
  return {
    totalEntries: postNamespaceEntries.length - globalBudgetResult.keysToRemove.length,
    totalBytes: bytesAfterPrune,
    removed: {
      stale: staleKeys.length,
      budget: namespaceBudgetKeys.length,
      global: globalBudgetResult.keysToRemove.length,
    },
    byNamespace: namespaceSnapshot,
  };
};

const maybeRunMaintenance = async (force = false) => {
  if (maintenancePromise) {
    return maintenancePromise;
  }

  const now = Date.now();
  if (!force && now - lastMaintenanceAt < MAINTENANCE_MIN_INTERVAL) {
    return null;
  }

  maintenancePromise = runMaintenanceInternal()
    .catch((error) => {
      console.warn('[cacheManager] Maintenance failed:', error?.message || error);
      return null;
    })
    .finally(() => {
      lastMaintenanceAt = Date.now();
      maintenancePromise = null;
    });

  return maintenancePromise;
};

export const cacheGet = async (key, options = {}) => {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    if (!rawValue) return null;

    const entry = parseEntry(key, rawValue);
    if (!entry) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    const ttl = typeof options.ttl === 'number' ? options.ttl : entry.ttl;
    if (typeof ttl === 'number' && Date.now() - entry.timestamp > ttl) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn(`[cacheManager] cacheGet failed for ${key}:`, error?.message || error);
    return null;
  }
};

export const cacheSet = async (key, data, options = {}) => {
  try {
    const now = Date.now();
    const entry = {
      data,
      timestamp: now,
      ttl: typeof options.ttl === 'number' ? options.ttl : null,
      lastAccessed: now,
      namespace: options.namespace || getNamespaceForKey(key),
    };

    await AsyncStorage.setItem(key, JSON.stringify(entry));
    void maybeRunMaintenance(false);
    return true;
  } catch (error) {
    console.warn(`[cacheManager] cacheSet failed for ${key}:`, error?.message || error);
    return false;
  }
};

export const cacheRemove = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[cacheManager] cacheRemove failed for ${key}:`, error?.message || error);
    return false;
  }
};

export const clearCacheByPrefixes = async (prefixes = []) => {
  if (!Array.isArray(prefixes) || prefixes.length === 0) {
    return 0;
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((key) => prefixes.some((prefix) => key.startsWith(prefix)));
    if (toRemove.length) {
      await AsyncStorage.multiRemove(toRemove);
    }
    return toRemove.length;
  } catch (error) {
    console.warn('[cacheManager] clearCacheByPrefixes failed:', error?.message || error);
    return 0;
  }
};

export const runCacheMaintenance = async ({ force = true } = {}) => maybeRunMaintenance(force);

export const getCacheMetrics = async () => {
  const entries = await collectEntries();
  const now = Date.now();
  const metrics = {
    totalEntries: entries.length,
    totalBytes: 0,
    staleEntries: 0,
    namespaces: {},
  };

  for (const entry of entries) {
    const namespace = entry.namespace || getNamespaceForKey(entry.key);
    if (!metrics.namespaces[namespace]) {
      metrics.namespaces[namespace] = { entries: 0, bytes: 0 };
    }
    metrics.namespaces[namespace].entries += 1;
    metrics.namespaces[namespace].bytes += entry.bytes;
    metrics.totalBytes += entry.bytes;

    const ttl = typeof entry.ttl === 'number' ? entry.ttl : null;
    if (ttl && now - entry.timestamp > ttl) {
      metrics.staleEntries += 1;
    }
  }

  return metrics;
};

export const startCacheSweepJob = (intervalMs = DEFAULT_SWEEP_INTERVAL) => {
  if (sweepIntervalId) {
    return () => {
      clearInterval(sweepIntervalId);
      sweepIntervalId = null;
    };
  }

  sweepIntervalId = setInterval(() => {
    void maybeRunMaintenance(true);
  }, intervalMs);

  void maybeRunMaintenance(true);

  return () => {
    if (sweepIntervalId) {
      clearInterval(sweepIntervalId);
      sweepIntervalId = null;
    }
  };
};

