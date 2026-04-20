# M6.2 Redis Cache and Blacklist Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Redis-backed caching for expensive dashboard reads and Redis-first token blacklist storage with Prisma fallback.

**Architecture:** Keep auth behavior unchanged at the API boundary while moving revocation checks behind a small Redis-backed utility. Dashboard stats should use a narrow cache helper with short TTLs so read-heavy requests avoid repeated aggregation work, but cache misses still compute from PostgreSQL. Redis failures must be non-fatal: blacklist checks fall back to Prisma and cache lookups recompute instead of failing requests.

**Tech Stack:** TypeScript, Express, Redis, Prisma, Jest

---

### Task 1: Redis client wrapper

**Files:**

- Create: `backend/src/config/redis.config.ts`
- Modify: `backend/src/config/env.config.ts`
- Test: `backend/tests/redis.config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("builds a redis client from REDIS_URL", () => {
  expect(redisClient.options?.url).toContain("redis://");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- redis.config.test.ts`
Expected: FAIL because the config file does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import { createClient } from "redis";
import { config } from "./env.config";

export const redisClient = createClient({ url: config.redis.url });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 JWT_ACCESS_SECRET=... JWT_REFRESH_SECRET=... ENCRYPTION_KEY=... npm test -- redis.config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/config/redis.config.ts backend/src/config/env.config.ts backend/tests/redis.config.test.ts
git commit -m "feat: add redis client wrapper"
```

### Task 2: Redis-backed token blacklist

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
Expected: FAIL because blacklist logic still only uses Prisma.

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
git commit -m "feat: use redis for token blacklist checks"
```

### Task 3: Dashboard stats cache

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
  // minimal cache wrapper
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

### Task 4: Verification and fallback

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
  await redis.get(key);
} catch {
  await prismaFallback();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 JWT_ACCESS_SECRET=... JWT_REFRESH_SECRET=... ENCRYPTION_KEY=... npm test -- token-blacklist.util.test.ts`
Expected: PASS

### Task 5: Dual-write revocations

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
Expected: FAIL until `addToBlacklist` writes to Redis.

- [ ] **Step 3: Write minimal implementation**

```ts
await redis.set(redisKey, '1', { EX: Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)) });
await prisma.tokenBlacklist.upsert(...);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `REDIS_URL=redis://localhost:6379 DATABASE_URL=postgresql://localhost:5432/credicheck JWT_ACCESS_SECRET=test-access-secret-key-32-characters-long-for-testing JWT_REFRESH_SECRET=test-refresh-secret-key-32-characters-long-for-testing ENCRYPTION_KEY=test-encryption-key-32-chars-long npm test -- token-blacklist.util.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/token-blacklist.util.ts backend/tests/token-blacklist.util.test.ts
git commit -m "feat: dual-write token revocations to redis"
```

### Notes

- Add `redis` to `backend/package.json` if it is not already present.
- Keep Prisma writes for token revocation so the system remains recoverable if Redis is restarted.
- Use a short dashboard TTL, ideally 30 to 60 seconds, to balance freshness and load reduction.
