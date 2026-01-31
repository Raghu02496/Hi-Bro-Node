import mongoose from "mongoose"

export default function connectMongo(){
    return mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log('Connected to MongoDB');
    }).catch((err)=>{
        console.log('MongoDB connection failed:',err.message);
    });
}



