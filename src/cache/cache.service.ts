import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisCache } from 'cache-manager-redis-yet';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: RedisCache,
  ) {}

  get redis() {
    return this.cacheManager.store.client;
  }

  /**
   * Reset the cache.
   * @returns A promise that resolves to void.
   */
  async resetCache(): Promise<void> {
    return this.cacheManager.reset();
  }

  async upsert(connectionId: string, meta: any) {
    await this.redis.hSet(
      'presence',
      connectionId,
      JSON.stringify({
        meta,
        when: Date.now(),
      }),
    );
  }

  async list() {
    const active = [];
    const dead = [];
    // const now = Date.now();

    const presence = await this.redis.hGetAll('presence');

    for (const connection in presence) {
      const details = JSON.parse(presence[connection]);
      details.connection = connection;

      // if (now - details.when > 8000) {
      //   dead.push(details);
      // } else {
      //   active.push(details);
      // }
      active.push(details);
    }

    if (dead.length) {
      this.clean(dead);
    }

    return active;
  }

  async remove(connectionId: string) {
    await this.redis.hDel('presence', connectionId);
  }

  clean(toDelete: any) {
    this.logger.log(`Cleaning ${toDelete.length} expired presences`);
    for (const presence of toDelete) {
      this.remove(presence.connection);
    }
  }
}
