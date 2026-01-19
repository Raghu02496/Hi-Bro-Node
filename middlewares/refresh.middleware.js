import jwt from 'jsonwebtoken';

export default async function refreshMiddleware(request, response, next){
  
  try {
        const refreshToken = request.cookies.refreshToken;
        if(!refreshToken){
            response.status(401).json({ok: false, data: 'No refresh token found'});
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        request.userId = decoded.id
        next();
      } catch (err) {
        response.status(403).json({ok : false, data: 'Invalid or expired token' });
      }
}