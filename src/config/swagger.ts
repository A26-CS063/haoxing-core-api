import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Haoxing Core API Documentation',
    version: '1.0.0',
    description: 'Dokumentasi Haoxing core API Team',
    contact: {
      name: 'Haoxing Core API Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT saja (tanpa kata Bearer)',
      },
    },
    schemas: {
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@haoxing.id' },
          password: { type: 'string', example: 'haoxing2026' },
        },
      },
      RefreshTokenInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      ChangePasswordInput: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'haoxing2026' },
          newPassword: { type: 'string', example: 'haoxingBaru2026' },
          confirmNewPassword: { type: 'string', example: 'haoxingBaru2026' },
        },
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        summary: 'Health Check Server & Koneksi Neon Database',
        tags: ['General'],
        responses: {
          200: { description: 'Server dan koneksi Neon PostgreSQL berjalan normal' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login Akun (Admin / Pemilik)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: { description: 'Login berhasil, mengembalikan accessToken dan refreshToken' },
          400: { description: 'Validasi login gagal' },
          401: { description: 'Email atau password salah' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Memperbarui Access Token Menggunakan Refresh Token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenInput' },
            },
          },
        },
        responses: {
          200: { description: 'Token baru berhasil dibuat' },
          401: { description: 'Refresh token tidak valid atau kedaluwarsa' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Mendapatkan Profil Pengguna yang Sedang Login',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profil berhasil diambil' },
          401: { description: 'Token tidak valid atau tidak ditemukan' },
        },
      },
    },
    '/api/v1/auth/change-password': {
      patch: {
        summary: 'Memperbarui Password Pengguna yang Sedang Login',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordInput' },
            },
          },
        },
        responses: {
          200: { description: 'Password berhasil diperbarui' },
          400: { description: 'Password lama salah atau konfirmasi tidak cocok' },
          401: { description: 'Pengguna tidak terautentikasi' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        summary: 'Logout dari Sistem',
        tags: ['Auth'],
        responses: {
          200: { description: 'Logout berhasil' },
        },
      },
    },
  },
};

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
  ],
  customSiteTitle: 'Haoxing Core API - Swagger Docs',
};
