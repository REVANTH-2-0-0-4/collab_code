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


export const deleteMsg=async({id,userid})=>{
    console.log(id,userid);
    try{
        if(!id){
            throw new Error("Id should not be null");
        }
        if(!mongoose.Types.ObjectId.isValid(id)){
            throw new Error("id should be mongoose id");
        }
        let message= await Chat.findById({_id:id});
        console.log(message);
        if(message.email!=userid){
            throw new Error("the user cannot delete this message");
        }
        await Chat.findByIdAndDelete({_id:id});
        return {
            message:"Deleted Successfully",
            status:"success"
        }
    }catch(err){
        return {
            message:err.message,
            status:"error"
        }
    }
    
}

export const getchat= async (projectid)=>{
    try {
        if(!projectid){
            throw new Error("project id should not be null");
        }
        if(!mongoose.Types.ObjectId.isValid(projectid)){
            throw new Error("project id should be a valid mongoose id");
        }
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