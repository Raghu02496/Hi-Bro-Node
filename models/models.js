import mongoose from "mongoose"
import { caseSchema, messageSchema, interrogationSchema, userSchema, sessionSchema } from "../schemas/schema.js"

export const caseModel = mongoose.model('Cases',caseSchema);
export const messageModel = mongoose.model('Messages',messageSchema)
export const interrogationModel = mongoose.model('Interrogations',interrogationSchema)
export const userModel = mongoose.model('Users',userSchema)
export const sessionModel = mongoose.model('Session', sessionSchema)