import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const cookieMiddleware = cookieParser();

export default async function (socket, next) {

    cookieMiddleware(socket.request, {}, () => {
        const token = socket.handshake.auth.accessToken

        if (!token) return next(new Error('No token provided'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error("Unauthorized"));
        }
    })
}