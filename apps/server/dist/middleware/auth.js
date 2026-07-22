import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
        return res.status(401).json({ error: 'Missing token' });
    try {
        const token = header.slice('Bearer '.length);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.authUser = { id: decoded.sub, role: decoded.role };
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.authUser)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!roles.includes(req.authUser.role))
            return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}
//# sourceMappingURL=auth.js.map