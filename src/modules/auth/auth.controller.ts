import { Request, Response } from 'express';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schema.js';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from '../../types/auth.types.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validasi login gagal',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await AuthService.login(parseResult.data);

    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Email atau password yang Anda masukkan salah',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: result,
    });
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    const parseResult = refreshTokenSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validasi refresh token gagal',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await AuthService.refreshToken(parseResult.data.refreshToken);

    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Refresh token tidak valid atau sudah kedaluwarsa',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token berhasil diperbarui',
      data: result,
    });
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak: Pengguna tidak terautentikasi',
      });
      return;
    }

    const parseResult = changePasswordSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validasi ganti password gagal',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await AuthService.changePassword(req.user.userId, parseResult.data);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logout berhasil. Silakan hapus token dari penyimpanan client.',
    });
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak: Pengguna tidak terautentikasi',
      });
      return;
    }

    const profile = await AuthService.getProfile(req.user.userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profil pengguna berhasil diambil',
      data: profile,
    });
  }
}
