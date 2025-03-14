import {io} from 'socket.io-client'

let socketInstance=null;

export const initializeSocket=({projectId})=>{
    let token= localStorage.getItem('token');
    // console.log("i am the token",token);
    socketInstance=io(import.meta.env.VITE_API_URL,{
        auth:{
            token:token
        },
        query:{
            projectId:projectId
        }
    });
    return socketInstance;
}   

export const receiveMessage =(eventName,cb)=>{
    socketInstance.on(eventName,cb);
}
export const sendMessage= (eventName,data)=>{
    socketInstance.emit(eventName,data);
}