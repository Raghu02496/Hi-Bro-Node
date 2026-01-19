import mongoose from "mongoose"

export const caseSchema = new mongoose.Schema({
    title : String,
    description : String,
    cluePool : Array,
    suspects : Array
})

export const messageSchema = new mongoose.Schema({
    userId : mongoose.Schema.Types.ObjectId,
    caseId : mongoose.Schema.Types.ObjectId,
    suspectId : mongoose.Schema.Types.ObjectId,
    interrogationId : mongoose.Schema.Types.ObjectId,
    role : String,
    content : String,
})

export const interrogationSchema = new mongoose.Schema({
    userId : mongoose.Schema.Types.ObjectId,
    suspectId : mongoose.Schema.Types.ObjectId,
    caseId : mongoose.Schema.Types.ObjectId,
    lastSummaryCount : Number,
    summary : String
})

export const userSchema = new mongoose.Schema({
    userName : {type : String, required : true, unique : true},
    password : {type : String, required : true}
})

export const sessionSchema = new mongoose.Schema({
    userId : {type : String, required : true, unique : true},
    refreshToken : {type : String, required : true, unique : true},
})