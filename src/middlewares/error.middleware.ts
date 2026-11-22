import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle JSON parse error from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Format JSON pada request body tidak valid',
    });
    return;
  }

  // Handle Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validasi input gagal',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // Handle generic error
  if (err instanceof Error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server internal',
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan yang tidak diketahui',
  });
};
