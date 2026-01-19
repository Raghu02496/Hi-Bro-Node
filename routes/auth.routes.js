import express from "express"
import { login, logout, refresh } from "../controllers/auth.controllers.js";

export const authPublicRouter = express.Router();
export const authPrivateRouter = express.Router();
export const authRefreshRouter = express.Router();

authPublicRouter.post('/login',login)
authRefreshRouter.post('/refresh',refresh)
authPrivateRouter.post('/logout',logout)