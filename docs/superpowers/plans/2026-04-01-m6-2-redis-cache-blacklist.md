# M6.2 Redis Cache and Blacklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Redis-backed caching for dashboard stats and Redis-first token blacklist storage with Prisma fallback.

**Architecture:** Introduce a tiny Redis config wrapper, then refactor token revocation to write to both Redis and Prisma while reads prefer Redis and fall back to Prisma if Redis is unavailable. Add a narrow cache helper for dashboard stats with a short TTL so heavy aggregate queries are avoided on repeated requests without changing the API contract.

**Tech Stack:** TypeScript, Express, Redis, Prisma, Jest

---

### Task 1: Add Redis client config

**Files:**

- Create: `backend/src/config/redis.config.ts`
- Modify: `backend/src/config/env.config.ts`
- Modify: `backend/package.json`
- Test: `backend/tests/redis.config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { redisClient } from "../src/config/redis.config";

it("builds a redis client from REDIS_URL", () => {
  expect(redisClient.options?.url).toContain("redis://");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- redis.config.test.ts`
Expected: FAIL because `backend/src/config/redis.config.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import { createClient } from "redis";
import { config } from "./env.config";

export const redisClient = createClient({ url: config.redis.url });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- redis.config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/config/redis.config.ts backend/src/config/env.config.ts backend/tests/redis.config.test.ts backend/package.json
git commit -m "feat: add redis client config"
```

Note: if `redis` is not already present in `backend/package.json`, add it in the implementation step before committing.

### Task 2: Redis-first token blacklist

**Files:**

- Modify: `backend/src/utils/token-blacklist.util.ts`
- Test: `backend/tests/token-blacklist.util.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("checks Redis before Prisma when token is blacklisted", async () => {
  await expect(TokenBlacklistUtil.isBlacklisted(token)).resolves.toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- token-blacklist.util.test.ts`
Expected: FAIL because blacklist reads still only use Prisma.

- [ ] **Step 3: Write minimal implementation**

```ts
const redisKey = `blacklist:${hash}`;
const cached = await redis.get(redisKey);
if (cached !== null) return cached === "1";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- token-blacklist.util.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/token-blacklist.util.ts backend/tests/token-blacklist.util.test.ts
git commit -m "feat: read token blacklist from redis"
```

### Task 3: Dual-write token revocations

**Files:**

- Modify: `backend/src/utils/token-blacklist.util.ts`
- Test: `backend/tests/token-blacklist.util.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("writes revoked tokens to redis and prisma", async () => {
  await TokenBlacklistUtil.addToBlacklist(token, userId, expiresAt);
  await expect(redisClient.get(`blacklist:${hash}`)).resolves.toBe("1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- token-blacklist.util.test.ts`
Expected: FAIL until `addToBlacklist` also writes to Redis.

- [ ] **Step 3: Write minimal implementation**

```ts
const ttlSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
await redis.set(redisKey, '1', { EX: ttlSeconds });
await prisma.tokenBlacklist.upsert({ ... });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- token-blacklist.util.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/token-blacklist.util.ts backend/tests/token-blacklist.util.test.ts
git commit -m "feat: dual-write token revocations to redis"
```

### Task 4: Redis fallback for blacklist reads

**Files:**

- Modify: `backend/src/utils/token-blacklist.util.ts`
- Test: `backend/tests/token-blacklist.util.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("falls back to prisma when redis is unavailable", async () => {
  jest.spyOn(redisClient, "get").mockRejectedValueOnce(new Error("redis down"));
  await expect(TokenBlacklistUtil.isBlacklisted(token)).resolves.toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- token-blacklist.util.test.ts`
Expected: FAIL until fallback handling is added.

- [ ] **Step 3: Write minimal implementation**

```ts
try {
  const cached = await redis.get(redisKey);
  if (cached !== null) return cached === "1";
} catch {
  // fallback to Prisma below
}

const entry = await prisma.tokenBlacklist.findUnique({
  where: { tokenHash: hash },
});
return !!entry;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- token-blacklist.util.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/token-blacklist.util.ts backend/tests/token-blacklist.util.test.ts
git commit -m "fix: keep blacklist checks working when redis is down"
```

### Task 5: Cache dashboard stats

**Files:**

- Create: `backend/src/utils/cache.util.ts`
- Modify: `backend/src/controllers/dashboard.controller.ts`
- Test: `backend/tests/cache.util.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("returns cached value on cache hit", async () => {
  await redisClient.set("dashboard", JSON.stringify("cached"));
  const loader = jest.fn().mockResolvedValue("fresh");
  const value = await getOrSet("dashboard", 30, loader);
  expect(value).toBe("cached");
  expect(loader).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- cache.util.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  // read from Redis, return cached JSON if present, otherwise load and set with TTL
}
```

- [ ] **Step 3b: Wire the dashboard controller through the cache helper**

```ts
const cacheKey = "dashboard-stats";
const stats = await getOrSet(cacheKey, 30, async () => ({
  queriesToday,
  activeReferences,
  activeUsers,
  matchRate: matchRate.toFixed(2),
  referencesByMonth,
  referencesByStatus,
  topSearched,
  recentActivity,
  searchesByDay,
}));
```

- [ ] **Step 3b: Handle Redis outages by recomputing**

```ts
try {
  // Redis hit/miss logic
} catch {
  return loader();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- cache.util.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/cache.util.ts backend/src/controllers/dashboard.controller.ts backend/tests/cache.util.test.ts
git commit -m "feat: cache dashboard stats in redis"
```
