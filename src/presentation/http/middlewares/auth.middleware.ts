/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, InvalidTokenError, TokenExpiredError, ForbiddenError } from '@shared/errors/index.js';
import { log as logger } from '@shared/utils/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        identity: string;
        room?: string;
        userType?: string;
      };
    }
  }
}

export interface JwtPayload {
  id: string;
  identity: string;
  room?: string;
  userType?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token from Authorization header
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    // Extract token (Bearer <token>)
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Attach user info to request
    req.user = {
      id: decoded.id,
      identity: decoded.identity,
      room: decoded.room,
      userType: decoded.userType,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(
        new InvalidTokenError('Invalid or expired token')
      );
    } else if (error instanceof jwt.TokenExpiredError) {
      next(
        new TokenExpiredError()
      );
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.user = {
      id: decoded.id,
      identity: decoded.identity,
      room: decoded.room,
      userType: decoded.userType,
    };

    next();
  } catch (error) {
    // Token invalid, but continue without user
    logger.warn('Optional auth failed', { error });
    next();
  }
};

/**
 * Require specific user type
 */
export const requireUserType = (...allowedTypes: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new UnauthorizedError('Authentication required')
      );
      return;
    }

    if (!req.user.userType || !allowedTypes.includes(req.user.userType)) {
      next(
        new ForbiddenError('Insufficient permissions')
      );
      return;
    }

    next();
  };
};
