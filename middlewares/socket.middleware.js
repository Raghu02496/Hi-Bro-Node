import jwt from 'jsonwebtoken';

export default async function (socket, next) {
    try {
        const token = socket.handshake.auth.accessToken
        if (!token) return next(new Error('No token provided'));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
    } catch (err) {
        next(new Error("Unauthorized"));
    }
}