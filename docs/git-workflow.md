# Panduan Alur Kerja Git (Git Workflow)

Panduan praktis alur kerja Git untuk kolaborasi tim di repositori **`haoxing-core-api`**.

---

## 1. Branch Utama

Repositori ini menggunakan dua branch utama:

- **`main`**: Versi produksi / rilis stabil yang siap dipakai dan didemokan.
- **`staging`**: Tempat integrasi fitur sehari-hari dan pengujian bersama tim.

Untuk pengerjaan fitur baru atau perbaikan, gunakan branch terpisah yang bersumber dari `staging`:

- Fitur baru: `feat/<nama-fitur>` (contoh: `feat/students-crud`, `feat/cashbook`)
- Perbaikan bug: `fix/<nama-bug>` (contoh: `fix/token-expiry`)
- Pembaruan konfigurasi/tooling: `chore/<nama-tugas>` (contoh: `chore/update-deps`)

---

## 2. Alur Pengerjaan Sehari-hari

### 1. Pull Updated Code

Sebelum mulai ngoding atau bikin branch baru, pastikan branch lokal kamu up-to-date:

```bash
git fetch origin
git checkout staging
git pull origin staging
```

Jika ingin membuat branch baru untuk fitur:

```bash
git checkout -b feat/nama-fitur
```

### 2. Code & Test

Setelah selesai ngoding fitur, jalankan pengecekan cepat di lokal agar saat di-push ke GitHub Actions CI langsung hijau:

```bash
npm run format
npm run lint
npm run test
```

### 3. Commit & Push

Gunakan pesan komit yang deskriptif dan ringkas (format Conventional Commits):

- `feat(students): tambah endpoint crud siswa`
- `fix(auth): perbaiki validasi refresh token`
- `test(students): tambah unit test service siswa`

Lalu push ke remote:

```bash
git push -u origin feat/nama-fitur
```

### 4. Buka Pull Request (PR) ke `staging`

- Buat Pull Request dengan target base branch: **`staging`**.
- GitHub Actions CI otomatis menjalankan linting, type-check, dan testing.
- Minta rekan tim untuk review dan approve sebelum di-merge.

### 5. Rilis ke `main`

Jika fitur-fitur di branch `staging` sudah selesai diuji dan siap dirilis atau didemokan, cukup buat PR dari `staging` menuju `main`:

- Target base branch: **`main`**
- Sumber branch: **`staging`**
- Setelah di-merge ke `main`, versi tersebut menjadi rilis stabil terbaru.

---

## 3. Checklist Sebelum Buka Pull Request

Pastikan beberapa poin ini aman sebelum mengajukan PR:

- [ ] Kode sudah di-update dengan versi staging terbaru (`git fetch` / `git pull`).
- [ ] Tidak menggunakan tipe `any` (manfaatkan type-safety TypeScript).
- [ ] Pesan respons API (`message`) menggunakan Bahasa Indonesia yang ramah pengguna.
- [ ] Pengujian di lokal berhasil (`npm run lint` dan `npm run test` lolos).
