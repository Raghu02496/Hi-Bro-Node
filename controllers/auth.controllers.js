import { userModel, sessionModel } from "../models/models.js"
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";

export async function login(request, response) {
    try {
        const { userName, password } = request.body

        const user = await userModel.findOne({ userName: userName })

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
            maxAge: 3600000,
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
        response.clearCookie("accessToken", {
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

async function deleteSession(userId) {
    const sessionData = await sessionModel.findOne({ userId: userId })

    if (sessionData) {
        await sessionModel.deleteMany({ userId: userId });
    }
}