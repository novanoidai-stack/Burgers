import { logger } from '../middleware/logger';
import { OrderItem } from '../types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private menuCache: CacheEntry<OrderItem[]> | null = null;
  private restaurantInfoCache: CacheEntry<Record<string, string>> | null = null;

  private readonly MENU_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RESTAURANT_INFO_TTL = 10 * 60 * 1000; // 10 minutes

  private isExpired<T>(entry: CacheEntry<T> | null): boolean {
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  setMenu(items: OrderItem[]): void {
    this.menuCache = {
      data: items,
      expiresAt: Date.now() + this.MENU_TTL,
    };
    logger.info('Menu cached', { itemCount: items.length });
  }

  getMenu(): OrderItem[] | null {
    if (this.isExpired(this.menuCache)) {
      this.menuCache = null;
      return null;
    }
    logger.debug('Menu retrieved from cache');
    return this.menuCache?.data || null;
  }

  setRestaurantInfo(info: Record<string, string>): void {
    this.restaurantInfoCache = {
      data: info,
      expiresAt: Date.now() + this.RESTAURANT_INFO_TTL,
    };
    logger.info('Restaurant info cached', { keys: Object.keys(info).length });
  }

  getRestaurantInfo(): Record<string, string> | null {
    if (this.isExpired(this.restaurantInfoCache)) {
      this.restaurantInfoCache = null;
      return null;
    }
    logger.debug('Restaurant info retrieved from cache');
    return this.restaurantInfoCache?.data || null;
  }

  invalidateMenu(): void {
    this.menuCache = null;
    logger.info('Menu cache invalidated');
  }

  invalidateRestaurantInfo(): void {
    this.restaurantInfoCache = null;
    logger.info('Restaurant info cache invalidated');
  }
}

export const cache = new SimpleCache();
