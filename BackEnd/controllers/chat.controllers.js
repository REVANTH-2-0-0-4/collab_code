import { validationResult } from "express-validator";
import chat from '../db/models/chat_model.js'
import * as chatServices from "../services/chat.services.js"
import usermodel from '../db/models/user_model.js'
export const addChatToProjectid= async (req,res)=>{
    // let errors= validationResult(req);
    // if(!errors.isEmpty()){
    //     return res.status(400).json({errors});
    // }
    let {projectid,message}= req.body;
    console.log(projectid);
    let loggedin_user= await usermodel.findOne({email:req.user.email});
    console.log(loggedin_user);
    let newmessage={
        email:req.user.email,
        sender:loggedin_user._id,
        project:projectid,
        message:message,
    }
    let response= await chatServices.addchat(newmessage);
    if(response.status=='error'){
        return res.status(400).json({message:"error"});
    }
    console.log(response);
    return res.status(200).json({message:response.message});
}   

export const getChatById= async(req,res)=>{
    let {projectid}=req.body;
    // console.log(projectid);
    try {
        let response= await chatServices.getchat(projectid);
        if(response.status=='error'){
            return res.status(400).json({message:response.message});
        }
        console.log(response);
        return res.json(response.chats).status(200);
    } catch (error) {
        return res.status(400).json({message:error.message});
    }
}