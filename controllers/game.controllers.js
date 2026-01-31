import { OpenAI } from "openai"
import { messageModel, caseModel, interrogationModel } from "../models/models.js";
import mongoose from "mongoose";

export function sendStatus(request, response) {
    return response.json({ ok: true, data: "Token verified" })
}

export async function msgChatGpt(request, response) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.DETECTIVE_KEY,
        });
        const { content, case_id, suspect } = request.body

        const curCase = await caseModel.findOne({_id : case_id})
        let interrogation = await interrogationModel.findOne({userId : request.userId, suspectId : suspect._id})

        if(!interrogation){
            interrogation = await interrogationModel.insertOne({caseId : case_id, userId : request.userId, suspectId : suspect._id, lastSummaryCount : 0, summary : ""})
        }

        // fetch the recent 10 messages
        let recentConversations = await messageModel.find(
            {userId : request.userId, suspectId : suspect._id },
            {role : 1,content : 1,_id:0}
        )
        .skip(interrogation.lastSummaryCount)
        .limit(10)

        //count the total number of messages
        let totalCount = await messageModel.countDocuments({userId : request.userId, suspectId : suspect._id })

        if(totalCount - interrogation.lastSummaryCount >= 10 ){
            interrogation.summary = await generateSummary(recentConversations,interrogation)
            recentConversations = []
        }

        recentConversations.push({ role: "user", content: content })
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role : 'system',
                    content : `You are an AI roleplaying as a suspect in a detective game. 
                                The user is the detective interrogating you. 
                                Stay fully in character — answer as the suspect would, using the case details provided. 
                                You can respond naturally to greetings or casual detective talk, 
                                but if the user asks about anything unrelated to the game or the case, 
                                respond with: "I'm not aware of that, detective.`
                },
                {
                    role: 'user',
                    content: `
                        You are interrogating a suspect in an ongoing case.
                  
                        **Suspect Details:**
                        - Name: ${suspect.name}
                        - Role: ${suspect.role}
                        
                        **Case Description:**
                        ${curCase.description}
                        
                        **Other Suspects:**
                        ${curCase.suspects.map(s => `- ${s.name} (${s.role})`).join('\n')}
                        
                        **Previous Conversation Summary (for context):**
                        ${interrogation.summary}
                        
                        Now continue the interrogation with this suspect based on the case context.`
                  },
                ...recentConversations
            ]
        });
        
        const reply = completion.choices[0].message.content;

        const result = await messageModel.insertMany([
            {caseId : case_id, role:'user', content : content, userId : request.userId, suspectId : suspect._id, interrogationId : interrogation._id},
            {caseId: case_id, role:'assistant', content : reply, userId : request.userId, suspectId : suspect._id, interrogationId : interrogation._id}
        ])

        let insertedIds = result.map((obj)=> obj._id.toString())
        return response.json({ ok: true, data: {reply : reply, insertedIds : insertedIds} });
    } catch (error) {
        console.log(error,'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

export async function getConversation(request, response){
    try{
        let { suspect_id, page_no } = request.body
        let conversations = await messageModel.find({userId : request.userId, suspectId : suspect_id},{content : 1, role : 1})
        .sort({_id : -1})
        .skip((page_no-1)*20)
        .limit(20)
        conversations.reverse();
        return response.json({ok : true , data : conversations})
    }catch(error){
        console.log(error,'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

async function generateSummary(recentConversations, interrogation){
    try {

        const openai = new OpenAI({
            apiKey: process.env.DETECTIVE_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role : 'system',
                    content : 'You have to summarize the interrogation conversation and compress as much possible without losing key details.'
                },
                {
                    role : 'user',
                    content : `previous conversations summary for context : ${interrogation.summary}\n
                    interrogation conversation : ${JSON.stringify(recentConversations)}`
                }
            ]
        });
    
        const reply = completion.choices[0].message.content;
    
        const newSummary = interrogation.summary ? (interrogation.summary+'\n'+reply) : reply
    
        await interrogationModel.updateOne({_id : interrogation._id},{$set : {summary : newSummary},$inc : {lastSummaryCount : 10}})
    
        return newSummary
    }catch (error) {
        console.log(error,'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

export async function generateCase(request, response) {
    try{
        const openai = new OpenAI({
            apiKey: process.env.DETECTIVE_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a game AI that creates detective cases in JSON format only."
                },
                {
                    role: 'user',
                    content: `Generate a case for my AI detective game. Follow this JSON structure exactly:
                            {
                                title: "",
                                description: "",
                                suspects: [
                                    { name: "", role: "", guilty: boolean }
                                ],
                                cluePool: [""]
                            }`
                }
            ],
            response_format: { type: "json_object" }
        });
    
        const reply = completion.choices[0].message.content;
        reply.suspects = reply.suspects.map(element => {
            const objectId = new mongoose.Types.ObjectId()
            return {_id : objectId,...element}
        });

        const insertedDoc = await caseModel.insertOne(reply);

        return response.json({ok : true , data : {_id : insertedDoc._id , ...reply}})
    }catch(error){
        console.log(error,'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

export async function getCaseById(request,response) {
    try{
        const {case_id} = request.body
        const result = await caseModel.findById({_id : case_id},{"suspects.guilty" : 0})

        return response.json({ok : true , data : result})
    }catch(error){
        console.log(error,'error')
        return response.status(500).json({ ok: false, error: error })
    }
}

export async function listCases(request, response){
    try{
        const { page_no } = request.body
        const cases = await caseModel.find({},{title : 1})
        return response.json({ok : true , data : cases})
    }catch(error){
        console.log(error,'error')
        return response.status(500).json({ ok: false, error: error })
    }
}