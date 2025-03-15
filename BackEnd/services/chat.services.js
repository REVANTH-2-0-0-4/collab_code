import mongoose from "mongoose";
import Chat from "../db/models/chat_model.js";

export const addchat=async (newmessage)=>{
    try{
        let message= await Chat.create(newmessage);
        return {
            status:"success",
            message
        }
    }
    catch(err){
        return {
            status:"error",
            message:err.message
        }
    }
}

export const getchat= async (projectid)=>{
    try {
        let chats= await Chat.find({project:projectid});
        return{
            status:"success",
            chats
        }
    } catch (error) {
        return{
            status:"error",
            message:error.message
        }
    }
}