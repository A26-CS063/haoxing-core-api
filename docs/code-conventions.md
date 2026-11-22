# Code Conventions & Architecture Guide: `haoxing-core-api`

Dokumen ini adalah pedoman standar penulisan kode (_code conventions_) dan pola arsitektur untuk seluruh pengembangan backend di repositori **`haoxing-core-api`**.

---

## 1. Pola Arsitektur: Feature-Based Modular Architecture

Setiap modul fitur bisnis wajib dikelompokkan ke dalam satu folder tersendiri di bawah `src/modules/<feature-name>/`:

```text
src/modules/<feature-name>/
├── <feature>.schema.ts      # Validasi payload request body, params, & query (Zod)
├── <feature>.service.ts     # Logika bisnis inti & pemanggilan database Prisma
├── <feature>.controller.ts  # Penanganan HTTP Request & pengembalian JSON Response
└── <feature>.routes.ts      # Definisi endpoint URL & pemasangan middleware guard
```

### Alur Eksekusi Request:

```text
HTTP Request ──> Route Guard (Auth / Role / RateLimit)
             ──> Controller (Zod Validation safeParse)
             ──> Service (Business Logic & Prisma Query)
             ──> Standard JSON Response (200 / 201 / 400 / 401 / 403 / 429 / 500)
```

---

## 2. Aturan Bahasa & Komunikasi

- **Internal Developer:**
  - Seluruh nama variabel, nama fungsi, nama kelas, tipe data, komentar kode, dan log terminal wajib menggunakan **Bahasa Inggris**.
- **User / Frontend Facing:**
  - Seluruh nilai `message` pada respons JSON yang akan ditampilkan di UI pengguna wajib menggunakan **Bahasa Indonesia** yang jelas dan baku.
- **Tanpa Emoji:**
  - Tidak diperkenankan menggunakan karakter emoji pada log console, kode sumber, maupun pesan respons API.

---

## 3. Standar Penamaan (_Naming Conventions_)

| Komponen                     | Format                           | Contoh                                                      |
| :--------------------------- | :------------------------------- | :---------------------------------------------------------- |
| **Folder Modul**             | `kebab-case` / tunggal           | `src/modules/auth`, `src/modules/students`                  |
| **Nama File**                | `<nama>.<peran>.ts`              | `auth.service.ts`, `auth.controller.ts`, `student.types.ts` |
| **Nama Kelas**               | `PascalCase`                     | `AuthController`, `AuthService`, `StudentService`           |
| **Nama Fungsi & Metode**     | `camelCase`                      | `login()`, `getProfile()`, `createStudent()`                |
| **Nama Variabel & Properti** | `camelCase`                      | `studentId`, `fullName`, `isRedisConnected`                 |
| **Tipe Data & Interface**    | `PascalCase`                     | `UserTokenPayload`, `AuthenticatedRequest`, `ApiResponse`   |
| **Database Table & Kolom**   | `snake_case` (via Prisma `@map`) | `@@map("student_db")`, `@map("student_id")`                 |
| **Enum Value**               | `lowercase`                      | `admin`, `pemilik`, `calon`, `terdaftar`, `aktif`, `batal`  |

---

## 4. Aturan Type-Safety: Zero `any`

- Sebisa mungkin hindari tipe `any`. Gunakan `unknown` jika tipe belum pasti, lalu lakukan type-narrowing.
- Seluruh input request wajib divalidasi dengan Zod dan di-infer tipenya:
  ```typescript
  export const createStudentSchema = z.object({ ... });
  export type CreateStudentInput = z.infer<typeof createStudentSchema>;
  ```
- Seluruh interface global wajib diletakkan di `src/types/<domain>.types.ts` (Single Source of Truth).

---

## 5. Standar Format Respons API

Seluruh endpoint wajib mengembalikan struktur JSON konsisten:

### A. Respons Berhasil:

```json
{
  "success": true,
  "message": "Data siswa berhasil ditambahkan",
  "data": { ... }
}
```

### B. Respons Gagal (Validasi Input):

```json
{
  "success": false,
  "message": "Validasi input gagal",
  "errors": {
    "fullName": ["Nama lengkap siswa wajib diisi"],
    "phone": ["Nomor kontak siswa wajib diisi"]
  }
}
```

### C. Respons Gagal (Error Umum / Hak Akses):

```json
{
  "success": false,
  "message": "Akses ditolak: Anda tidak memiliki izin untuk fitur ini"
}
```

---

## 6. Standar HTTP Status Codes

- **`200 OK`**: Permintaan `GET`, `PATCH`, atau login berhasil.
- **`201 Created`**: Pembuatan data baru (`POST`) berhasil disimpan di database.
- **`400 Bad Request`**: Validasi Zod gagal atau input client tidak valid.
- **`401 Unauthorized`**: Token JWT tidak ada, salah, atau kedaluwarsa.
- **`403 Forbidden`**: Peran akun (`role`) tidak memiliki hak akses (misal Pemilik mencoba tambah/ubah data).
- **`404 Not Found`**: Data tidak ditemukan di database.
- **`429 Too Many Requests`**: Terkena blokir batas request (Rate Limit).
- **`500 Internal Server Error`**: Kesalahan sistem internal yang tidak terduga.

---

## 7. Standar Pengujian Otomatis (Testing Conventions)

### A. Framework & Library
- **Test Runner:** Vitest (kompatibel ES Modules dan TypeScript secara bawaan).
- **HTTP Integration Test:** Supertest (simulasi request ke Express app tanpa menjalankan server).
- **Coverage Engine:** `@vitest/coverage-v8` (target minimal 70% cakupan kode per metrik).

### B. Struktur Folder Test
Setiap modul wajib memiliki folder `__tests__/` di dalam folder modulnya:
```text
src/modules/<feature-name>/
├── __tests__/
│   ├── <feature>.schema.test.ts    # Unit test: validasi Zod schema
│   ├── <feature>.service.test.ts   # Unit test: logika bisnis (mock DB & dependencies)
│   └── <feature>.api.test.ts       # Integration test: hit endpoint via supertest
├── <feature>.schema.ts
├── <feature>.service.ts
├── <feature>.controller.ts
└── <feature>.routes.ts
```

Untuk middleware dan utilitas global, folder `__tests__/` diletakkan di bawah `src/middlewares/` atau `src/utils/`:
```text
src/middlewares/
├── __tests__/
│   └── auth.middleware.test.ts
├── auth.middleware.ts
└── ...
```

### C. Strategi Testing per Layer
Setiap modul cukup membuat **3 jenis file test**:

| Jenis Test | File | Apa yang Diuji | Teknik |
| :--- | :--- | :--- | :--- |
| **Schema Test** | `*.schema.test.ts` | Validasi input Zod (edge case: kosong, format salah, batas karakter, pencocokan field) | Langsung panggil `safeParse()`, tanpa mock. |
| **Service Test** | `*.service.test.ts` | Logika bisnis murni (pencarian user, hashing password, pembuatan token, ID generator) | Mock Prisma, bcrypt, dan dependency eksternal menggunakan `vi.mock()`. |
| **API / Integration Test** | `*.api.test.ts` | Endpoint HTTP secara utuh (request -> middleware -> controller -> service -> response) | Supertest ke Express `app`, mock database layer. |

**Yang TIDAK perlu dibuat test terpisah:**
- **Controller** -- fungsi controller sudah tercakup 100% oleh API/Integration test.
- **Routes** -- deklarasi path dan middleware sudah tercakup oleh API/Integration test saat endpoint di-hit.

### D. Konvensi Penamaan Test
- Nama file: `<nama>.<layer>.test.ts` (contoh: `auth.schema.test.ts`, `students.service.test.ts`).
- Gunakan `describe()` untuk mengelompokkan per fungsi/metode yang diuji.
- Gunakan `it()` dengan deskripsi yang jelas menggambarkan skenario:
  ```typescript
  describe('AuthService.login()', () => {
    it('should return null when user is not found', async () => { ... });
    it('should return null when password is incorrect', async () => { ... });
    it('should return tokens and user profile on valid credentials', async () => { ... });
  });
  ```

---

## 8. Perintah Standar Linter, Prettier, & Testing

- Cek format penulisan: `npm run format:check`
- Rapikan format otomatis: `npm run format`
- Cek kepatuhan aturan koding: `npm run lint`
- Perbaiki error linting otomatis: `npm run lint:fix`
- Jalankan pengujian otomatis: `npm run test`
- Jalankan pengujian interaktif: `npm run test:watch`
- Cek cakupan pengujian (coverage): `npm run test:coverage`

---

## 9. Panduan Alur Kerja Git & Pull Request

Seluruh kontributor wajib mengikuti alur kerja percabangan `staging` dan `main`, standar pesan komit (Conventional Commits), serta checklist Pull Request yang dirinci dalam dokumen [docs/git-workflow.md](./git-workflow.md).
