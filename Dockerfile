# syntax=docker/dockerfile:1
# Next.js standalone — untuk EasyPanel (Build Method: Dockerfile, Port 3000)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL palsu supaya prisma generate jalan saat build.
# Nilai aslinya diinjeksi saat runtime oleh EasyPanel.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
# `npm run build` sudah memanggil `prisma generate` lebih dulu.
RUN npm run build

# Kumpulkan CLI prisma + seluruh dependensinya ke satu folder, supaya migrasi
# bisa dijalankan tanpa ikut membawa node_modules penuh.
#
# JANGAN buang @prisma/studio-core dan @prisma/dev walau kelihatannya cuma
# dipakai `prisma studio`: prisma/build/cli.js me-require keduanya di level
# modul, jadi tanpa itu SEMUA perintah prisma gagal - termasuk migrate deploy.
RUN <<'EOF' node
const fs = require("fs");
const path = require("path");
const root = "/app/node_modules";
const out = "/app/cli-modules";
const seen = new Set();
const manifest = (name) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, name, "package.json"), "utf8"));
  } catch {
    return null;
  }
};
const walk = (name) => {
  if (seen.has(name)) return;
  const pkg = manifest(name);
  if (!pkg) return;
  seen.add(name);
  const deps = { ...pkg.dependencies, ...pkg.optionalDependencies };
  Object.keys(deps).forEach(walk);
};
// dotenv dipakai oleh prisma.config.ts.
["prisma", "dotenv"].forEach(walk);
for (const name of seen) {
  fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true, dereference: true });
}
console.log(`prisma cli: ${seen.size} paket disalin`);
EOF

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Dipakai entrypoint (dan kalau perlu dari terminal container) untuk migrasi.
# prisma.config.ts wajib ikut: schema.prisma tidak memuat url, datasource-nya
# dibaca dari sana.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/cli-modules ./node_modules
RUN mkdir -p node_modules/.bin \
    && chmod +x node_modules/prisma/build/index.js \
    && ln -sf ../prisma/build/index.js node_modules/.bin/prisma

# Entrypoint: migrate deploy lalu start server. sed membuang CR kalau file
# ini ter-checkout dengan line ending Windows (shebang bermasalah).
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["/app/entrypoint.sh"]
