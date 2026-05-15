# Frontend Agung Presence

Frontend UWP untuk Agung Presence berbasis Next.js App Router. Project ini sudah disiapkan untuk terhubung ke backend Laravel di `api-agung-presence.test` melalui API proxy internal Next.js.

## Kebutuhan

- Node.js sesuai dukungan Next.js 16
- Yarn atau npm
- Backend `api-agung-presence` berjalan di `http://api-agung-presence.test`

## Konfigurasi Environment

Salin `.env.example` menjadi `.env.local` jika belum ada.

```bash
cp .env.example .env.local
```

Variabel yang tersedia:

```bash
AGUNG_PRESENCE_API_URL=http://api-agung-presence.test/api
AGUNG_PRESENCE_API_TIMEOUT_MS=8000
NEXT_PUBLIC_API_PROXY_PATH=/api/backend
```

Browser frontend memanggil `/api/backend/...`, lalu Next.js meneruskan request ke `AGUNG_PRESENCE_API_URL`. Dengan pola ini, token Bearer tetap bisa dikirim ke backend tanpa frontend harus memanggil domain backend langsung.

## Menjalankan

```bash
yarn dev
```

Buka `http://localhost:3000`.

## Endpoint Backend yang Sudah Dipakai

- `GET /api/status`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Token Sanctum disimpan di `localStorage` dengan key `agung-presence-token`, lalu dikirim sebagai `Authorization: Bearer <token>` untuk request yang membutuhkan autentikasi.

## Struktur Penting

- `src/app/api/backend/[...path]/route.ts`: API proxy ke backend Laravel.
- `src/lib/api/client.ts`: helper request API untuk browser.
- `src/lib/api/types.ts`: tipe response dasar dari backend.
- `src/app/components/auth-panel.tsx`: baseline UI login dan status koneksi API.
