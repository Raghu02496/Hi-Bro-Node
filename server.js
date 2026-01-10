import express from "express"
import cors from "cors"
import gameRouter from "./routes/game.routes.js"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";
import connectMongo  from "./mongo.js"
import authMiddleware from "./middlewares/api.middleware.js"
import http from "http"
import { Server } from "socket.io"
import socketMiddleware from "./middlewares/socket.middleware.js"
import socketSetup from "./socketSetup.js"
import chatRouter from "./routes/chat.routes.js"

const app = express();

app.use(
    express.json(),
    cookieParser(),
    cors({
        origin: process.env.ORIGIN,
        credentials: true
    })
);

const server = http.createServer(app)
const io = new Server(server,{ cors: { origin: process.env.ORIGIN, credentials: true } })

await connectMongo()

io.use(socketMiddleware);
socketSetup(io);

server.listen(process.env.PORT, () => {
    console.log(`Server Listening on PORT: ${process.env.PORT}`);
});

app.use('/protected', authMiddleware, gameRouter, chatRouter);
app.use('/public',authRouter)