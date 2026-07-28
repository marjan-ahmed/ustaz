import { Request, Response, NextFunction } from 'express';
export type AuthUser = {
    id: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
};
declare global {
    namespace Express {
        interface Request {
            authUser?: AuthUser;
        }
    }
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireRole(roles: AuthUser['role'][]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map