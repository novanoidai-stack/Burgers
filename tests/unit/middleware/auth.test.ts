// tests/unit/middleware/auth.test.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireTenant } from '../../../src/middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(payload: object, secret = JWT_SECRET) {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

function mockReq(token?: string): Partial<Request> {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

describe('requireTenant middleware', () => {
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('calls next() and sets req.tenant when token is valid', () => {
    const token = makeToken({ tenant: '001' });
    const req = mockReq(token) as Request;

    requireTenant(req, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as Request & { tenant: string }).tenant).toBe('001');
  });

  it('returns 401 when no Authorization header', () => {
    const req = mockReq() as Request;

    requireTenant(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const token = jwt.sign({ tenant: '001' }, JWT_SECRET, { expiresIn: '-1s' });
    const req = mockReq(token) as Request;

    requireTenant(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token has no tenant claim', () => {
    const token = makeToken({ user: 'admin' }); // no tenant field
    const req = mockReq(token) as Request;

    requireTenant(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token tenant claim has invalid format', () => {
    const token = makeToken({ tenant: 'invalid slug!' });
    const req = mockReq(token) as Request;

    requireTenant(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
