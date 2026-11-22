import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorHandler } from '../error.middleware.js';

describe('Error Handler Middleware', () => {
  const mockRequest = {} as Request;
  const mockNext = vi.fn() as NextFunction;

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  it('should return 400 on JSON SyntaxError with body property', () => {
    const err = new SyntaxError('Unexpected token');
    (err as SyntaxError & { body: string }).body = '{ invalid json }';
    const res = mockResponse();

    errorHandler(err, mockRequest, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Format JSON pada request body tidak valid',
    });
  });

  it('should return 400 on ZodError', () => {
    const parseResult = z.string().min(1, 'Email wajib diisi').safeParse('');
    if (parseResult.success) {
      throw new Error('Expected validation to fail');
    }

    const zodError = parseResult.error;
    const res = mockResponse();

    errorHandler(zodError, mockRequest, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validasi input gagal',
      })
    );
  });

  it('should return 500 on generic Error', () => {
    const err = new Error('Something broke');
    const res = mockResponse();

    errorHandler(err, mockRequest, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Terjadi kesalahan pada server internal',
      error: 'Something broke',
    });
  });

  it('should return 500 on unknown non-Error object', () => {
    const err = 'some string error';
    const res = mockResponse();

    errorHandler(err, mockRequest, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Terjadi kesalahan yang tidak diketahui',
    });
  });
});
