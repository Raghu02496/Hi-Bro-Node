import express from "express"
import { login, logout, refresh } from "../controllers/auth.controllers.js";

const authRouter = express.Router();

authRouter.post('/login',login)
authRouter.post('/logout',logout)
authRouter.post('/refresh',refresh)

export default authRouter