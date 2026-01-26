import express from "express"
import { loginWithEmail, logout, refresh, loginWithGoogle } from "../controllers/auth.controllers.js";

export const authPublicRouter = express.Router();
export const authPrivateRouter = express.Router();
export const authRefreshRouter = express.Router();

authPublicRouter.post('/loginWithEmail',loginWithEmail)
authPublicRouter.post('/loginWithGoogle',loginWithGoogle)
authRefreshRouter.post('/refresh',refresh)
authPrivateRouter.post('/logout',logout)