import { userModel, sessionModel } from "../models/models.js"
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

export async function loginWithEmail(request, response) {
    try {
        const { email, password } = request.body

        const user = await userModel.findOne({ email: email })

        if (!user) {
            return response.status(400).json({ ok: false, data: "User not found" })
        }

        const valid = await bcrypt.compare(password, user.password)

        if (!valid) {
            return response.status(400).json({ ok: false, data: "Invalid password" })
        }

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' })

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })

        await deleteSession(user._id)

        const session = new sessionModel({
            userId: user._id,
            refreshToken: bcrypt.hashSync(refreshToken, 10)
        })

        await session.save()

        response.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.PROD,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        })

        return response.json({ ok: true, accessToken: accessToken });
    } catch (error) {
        console.log(error, 'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

export async function refresh(request, response) {
    try {

        const sessionData = await sessionModel.findOne({ userId: request.userId })

        if (!sessionData) {
            response.status(401).json({ ok: false, data: 'Not logged in' });
        }
        const valid = bcrypt.compareSync(request.cookies.refreshToken, sessionData.refreshToken);
        if (!valid) return response.json({ ok: false, data: "Invalid refresh token" })

        const accessToken = jwt.sign({ id: request.userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
        response.json({ ok: true, accessToken: accessToken });
    } catch (error) {
        console.log(error, 'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

export async function logout(request, response) {
    try {
        response.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.PROD,
            sameSite: 'None',
            maxAge: 3600000,
            path: '/'
        });

        await deleteSession(request.userId)
        return response.json({ ok: true, message: "Logged out successfully" });
    } catch (error) {
        console.log(error, 'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

export async function loginWithGoogle(request, response) {
    try {
        const { authorizationToken } = request.body
        const payload = {
            code: authorizationToken,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        }
        fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            body: JSON.stringify(payload)
        })
            .then((value) => value.json())
            .then(async (value) => {
                try{
                    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
                    const tokenValue = await client.verifyIdToken({ idToken: value.id_token, audience: process.env.GOOGLE_CLIENT_ID })
    
                    const userInfo = tokenValue.getPayload()
                    if (userInfo && userInfo.email_verified) {
                        const user = await userModel.findOne({ email: userInfo.email })
    
                        if (!user) {
                            return tokenValue.status(400).json({ ok: false, data: "User not found" })
                        }
    
                        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' })
    
                        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
    
                        await deleteSession(user._id)
    
                        const session = new sessionModel({
                            userId: user._id,
                            refreshToken: bcrypt.hashSync(refreshToken, 10)
                        })
    
                        await session.save()
    
                        response.cookie("refreshToken", refreshToken, {
                            httpOnly: true,
                            secure: process.env.PROD,
                            sameSite: 'None',
                            maxAge: 7 * 24 * 60 * 60 * 1000,
                            path: '/'
                        })
    
                        return response.json({ ok: true, accessToken: accessToken });
                    }
                }catch(error){
                    console.log(error, 'error')
                    return response.status(500).json({ ok: false, error: error })
                }
            })

    } catch (error) {
        console.log(error, 'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

async function deleteSession(userId) {
    const sessionData = await sessionModel.findOne({ userId: userId })

    if (sessionData) {
        await sessionModel.deleteMany({ userId: userId });
    }
}