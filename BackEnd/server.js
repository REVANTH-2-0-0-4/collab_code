import http from 'http'
import app from './app.js'
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import project_model from './db/models/project_model.js';
import Chat from './db/models/chat_model.js';
import { generateResult } from './services/ai.services.js';
const PORT=process.env.PORT || 3000;
const server=http.createServer(app);
const io= new Server(server,{cors: {
        origin: '*'
    }});

io.use(async (socket,next)=>{
    try {
        let token= socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        let projectId= socket.handshake.query.projectId;
        if(!mongoose.Types.ObjectId.isValid(projectId)){
            throw new Error("Invalid ProjectId");
        }
        if(!token){
            throw new Error("Authentication User");
        }
        socket.project= await project_model.findById(projectId);
        let decoded= jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded){
            throw new Error("Authentication User");
        }
        socket.user=decoded
        next();
    } catch (error) {
        next(error);
    }
})
io.on('connection',socket=>{
    console.log("a user connected");
    socket.roomId= socket.project._id.toString();
    socket.join(socket.roomId);
    socket.on('project-message',async (data)=>{
        const message= data.message;
        io.to(socket.roomId).emit('project-message',data)
        const isAiPresent = message.includes('@ai');
        if(isAiPresent){
            console.log("yes ai is present");
            let res= await generateResult(data.message);
            console.log(res);
            let newmessage={
                email:'AI@ai.com',
                sender:'67d7da39b9b904cb0ad30971',
                project:socket.roomId,
                message:res,
            }
            await Chat.create(newmessage);
            io.to(socket.roomId).emit('project-message',{
                message:res.toString(),
                sender:{
                    _id:'67d7da39b9b904cb0ad30971',
                    email:'AI@ai.com'
                }
            })
            return;
        }
    })
    socket.on('',()=>{});
    socket.on('disconnect',()=>{
        console.log("User disconnected");
        socket.leave(socket.roomId);
    });
})
server.listen(PORT,()=>{
    console.log("LISTENING ON PORT : ",PORT);
})