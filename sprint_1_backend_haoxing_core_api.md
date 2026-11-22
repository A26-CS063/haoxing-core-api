# Dokumen Sprint 1 Backend: `haoxing-core-api` (Minggu 1)

**Penanggung Jawab:** Rahmad Fahrurrozi (`fs525b6y1490` - AI Full-Stack / Backend Lead)  
**Repositori:** `A26-CS063/haoxing-core-api`  
**Tech Stack:** Node.js, Express.js, TypeScript (Zero `any`), Prisma ORM, Neon Serverless PostgreSQL, JWT, Bcrypt, Zod  
**Fokus Sprint 1 (Minggu 1):** Setup Repo & Neon DB, Migrasi Skema ERD + Seeding, Modul Auth & RBAC (`admin` vs `pemilik`), dan Modul CRUD Data Siswa (`students`).

---

## 1. Sprint 1 Goals Khusus `haoxing-core-api`

Sesuai jadwal Minggu 1 pada **Project Plan (`A26-CS063`)**, target yang harus beres di repositori **`haoxing-core-api`** adalah:

1. **Fondasi Server & Koneksi Neon PostgreSQL Aktif:** Server Express + TypeScript berjalan stabil dengan konfigurasi `DATABASE_URL` (Pooled) dan `DIRECT_URL` (Direct) ke Neon PostgreSQL.
2. **Skema ERD & Seeding Data Awal Berjalan:** Seluruh tabel inti (`users`, `students`, `pretest_results`, `program_classes`, `enrollments`, `cash_ledger`, `refund_requests`) sudah ter-migrate di Neon supaya tidak perlu bongkar skema lagi di Minggu 2–3, dilengkapi `seed.ts` untuk akun Admin, akun Pemilik, katalog brosur, dan 6 siswa contoh.
3. **Modul Auth & Guard RBAC Selesai:** Endpoint login mengeluarkan token JWT berisi `role` (`admin` atau `pemilik`), middleware `authenticateJWT` menolak akses tanpa token (`401`), dan `requireRole` membatasi hak mutasi data hanya untuk `admin` (`403`).
4. **Modul CRUD Data Siswa & Status Pendaftaran Selesai:** Endpoint untuk menambah, mengubah, mencari, dan memfilter status siswa (`Calon`, `Terdaftar`, `Aktif`, `Batal`) berjalan penuh serta lulus skenario uji negatif (menolak nama atau nomor kontak kosong dengan status `400`).

---

## 2. Struktur Folder Target Sprint 1 (`haoxing-core-api`)

```text
haoxing-core-api/
├── prisma/
│   ├── schema.prisma               # Skema database Neon PostgreSQL
│   ├── migrations/                 # Hasil npx prisma migrate dev
│   └── seed.ts                     # Seeder akun Admin, Pemilik, 6 Program & 6 Siswa awal
├── src/
│   ├── config/
│   │   ├── env.ts                  # Validasi variabel .env dengan Zod
│   │   └── db.ts                   # Singleton PrismaClient
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # authenticateJWT & requireRole(['admin', 'pemilik'])
│   │   └── error.middleware.ts     # Global error handler & standard JSON response
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.schema.ts      # Validasi Zod untuk login payload
│   │   │   ├── auth.service.ts     # Verifikasi email, bcrypt compare & sign JWT
│   │   │   ├── auth.controller.ts  # Handler POST /login dan GET /me
│   │   │   └── auth.routes.ts      # Route /api/v1/auth
│   │   └── students/
│   │       ├── students.schema.ts  # Validasi Zod tambah/ubah siswa & filter query
│   │       ├── students.service.ts # Query Prisma (search, filter status, auto-generate ID HX-26xxx)
│   │       ├── students.controller.ts # Handler GET, POST, PATCH, DELETE /students
│   │       └── students.routes.ts  # Route /api/v1/students
│   ├── app.ts                      # Konfigurasi Express, CORS, Helmet, Morgan
│   └── server.ts                   # Entry point server (listen PORT)
├── .env.example                    # Template env untuk dicopy ke .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Spesifikasi Endpoint Sprint 1 (`haoxing-core-api`)

### A. Health Check
- **`GET /api/v1/health`** (Publik)
  - Mengecek status server Express dan latensi ping ke Neon PostgreSQL (`SELECT 1`).

### B. Modul Auth & RBAC (`/api/v1/auth`)
1. **`POST /api/v1/auth/login`** (Publik)
   - **Body:** `{ "email": "admin@haoxing.id", "password": "haoxing2026" }`
   - **Validasi Zod:** Menolak jika `email` atau `password` kosong (`400 Bad Request`).
   - **Response `200 OK`:** Mengembalikan `token` (JWT) dan objek `user` (`id`, `fullName`, `email`, `role`).
2. **`GET /api/v1/auth/me`** (Protected: `admin`, `pemilik`)
   - **Header:** `Authorization: Bearer <jwt_token>`
   - **Response `200 OK`:** Mengembalikan profil pengguna yang sedang aktif beserta perannya.

### C. Modul Manajemen Data Siswa (`/api/v1/students`)
1. **`GET /api/v1/students`** (Protected: `admin`, `pemilik`)
   - **Query Params:**
     - `search` (opsional): Mencari berdasarkan `fullName`, `studentCode` (`HX-26101`), atau `phone` (*case-insensitive*).
     - `status` (opsional): Filter status pendaftaran (`Calon`, `Terdaftar`, `Aktif`, `Batal`).
     - `hasPretest` (opsional): Filter siswa yang belum ikut pre-test (`true` / `false`).
   - **Response `200 OK`:** Daftar siswa terurut dari terbaru beserta metadata jumlah per status.
2. **`GET /api/v1/students/:id`** (Protected: `admin`, `pemilik`)
   - **Response `200 OK`:** Detail lengkap 1 siswa beserta riwayat pre-test dan kelasnya.
3. **`POST /api/v1/students`** (Protected: **Hanya `admin`**)
   - **Body:**
     ```json
     {
       "fullName": "Nadia Putri Maharani",
       "phone": "0812-3456-7810",
       "status": "Calon",
       "hasPretest": false
     }
     ```
   - **Validasi Wajib (Sesuai Rencana Pengujian Project Plan):**
     - Jika `fullName` kosong atau hanya spasi -> Tolak dengan `400 Bad Request` (`"Nama lengkap siswa wajib diisi"`).
     - Jika `phone` kosong -> Tolak dengan `400 Bad Request` (`"Nomor kontak siswa wajib diisi"`).
     - Otomatis men-generate kode siswa berformat `HX-26xxx` dan memberi flag `recommendedLevel = "Belum ditentukan (Wajib Pre-Test)"` jika `hasPretest: false`.
4. **`PATCH /api/v1/students/:id`** (Protected: **Hanya `admin`**)
   - **Body:** Bisa mengubah `fullName`, `phone`, `status` (`Calon` -> `Terdaftar` -> `Aktif` / `Batal`), atau memperbarui status pre-test.
5. **`DELETE /api/v1/students/:id`** (Protected: **Hanya `admin`**)
   - Menghapus atau menonaktifkan data siswa jika terjadi kesalahan input ganda.

---

## 4. Checklist Pengujian Mandiri (Sesuai Tabel Rencana Pengujian Project Plan)

Sebelum tutup Sprint 1 dan buka Pull Request ke `main`, pastikan 6 skenario Postman/cURL ini sudah lulus semua di `haoxing-core-api`:

| No | Skenario Uji di `haoxing-core-api` | Input / Aksi di Postman | Expected Output (Hasil yang Diharapkan) |
| :--- | :--- | :--- | :--- |
| **1** | **Login Sukses (Admin & Pemilik)** | `POST /api/v1/auth/login` dengan email & password benar | Status `200 OK`, keluar JWT token dan field `role: "admin"` atau `"pemilik"`. |
| **2** | **Login Gagal (Input Kosong)** | `POST /api/v1/auth/login` dengan `{ "email": "", "password": "" }` | Status `400 Bad Request`, pesan error validasi Zod tampil rapi. |
| **3** | **Keamanan Akses Tanpa Token** | `GET /api/v1/students` tanpa header `Authorization` | Status `401 Unauthorized` (`"Akses ditolak: Token autentikasi tidak ditemukan"`). |
| **4** | **Proteksi Peran RBAC (Pemilik Read-Only)** | `POST /api/v1/students` memakai token milik `pemilik@haoxing.id` | Status `403 Forbidden` (`"Peran Anda tidak memiliki izin untuk fitur ini"`). |
| **5** | **Tambah Siswa Lengkap (Valid)** | `POST /api/v1/students` memakai token Admin dengan `fullName` & `phone` terisi | Status `201 Created`, data tersimpan di Neon DB dengan ID `HX-26xxx` dan status `Calon`. |
| **6** | **Tambah Siswa Kosong (Invalid)** | `POST /api/v1/students` dengan `fullName: ""` atau `phone: ""` | Status `400 Bad Request`, data ditolak dan tidak masuk ke database. |
