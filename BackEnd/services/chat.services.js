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
        chats.forEach((chat)=>{
            const timestamp = chat.createdAt;
            const date = new Date(timestamp);
            const options = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true, 
            day: "numeric",
            month: "numeric",
            year: "numeric",
            };
            const formattedDate = date.toLocaleString("en-US", options);
            // console.log(formattedDate); 
            chat._doc.createdAt=formattedDate;
        })
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