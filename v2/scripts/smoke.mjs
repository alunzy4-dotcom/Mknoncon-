const base = process.env.SMOKE_BASE_URL;

if (!base) {
  console.error("SMOKE_BASE_URL is required");
  process.exit(1);
}

async function check(path, expectedStatus = 200) {
  const res = await fetch(new URL(path, base), { redirect: "manual" });
  console.log(path, res.status);

  if (res.status !== expectedStatus) {
    throw new Error(`${path}: expected ${expectedStatus}, got ${res.status}`);
  }
}

await check("/", 200);
await check("/login", 200);

const health = await fetch(new URL("/api/health", base), { cache: "no-store" });
console.log("/api/health", health.status);
const healthBody = await health.json().catch(() => null);

if (health.status !== 200 || !healthBody?.ok) {
  throw new Error("Health check failed: " + JSON.stringify(healthBody));
}

const protectedPage = await fetch(new URL("/dashboard", base), {
  redirect: "manual"
});
console.log("/dashboard", protectedPage.status);

if (![302, 303, 307, 308].includes(protectedPage.status)) {
  throw new Error("Dashboard should redirect unauthenticated users.");
}

console.log("MKNONCON_V2_SMOKE_OK");
