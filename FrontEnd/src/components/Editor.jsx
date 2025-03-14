import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TbUsers, TbUsersPlus, TbSend, TbX } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";
import PlaceholdersAndVanishInput from "./PlaceholdersAndVanishInput.jsx";
import TracingBeam from "../components/TracingBeam.jsx";
import { useAspect } from "@react-three/drei";
import axios from "../config/axios.js";
import UserSelectionModal from "./modals/UserSelectionModal.jsx";
import { receiveMessage,sendMessage,initializeSocket } from "@/config/socket.js";
// Utility function for class name merging
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// Sidebar Component
const Sidebar = ({ open, setOpen, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute left-0 top-0 h-full w-[400px] bg-gray-800/95 backdrop-blur-md z-30 shadow-xl rounded-r-lg "
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <TbX size={24} />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Message Component
const Message = ({ sender, content, timestamp }) => {
  return (
    <div className={`mb-3 ${sender === "user" ? "ml-auto" : ""} max-w-[80%]`}>
      <div
        className={cn(
          "p-3 rounded-lg shadow-md",
          sender === "user"
            ? "bg-cyan-700/70 text-white"
            : "bg-gray-700/70 text-gray-200"
        )}
      >
        <p className="text-sm font-inter">{content}</p>
      </div>
      <div className="text-xs text-gray-400 mt-1">{timestamp}</div>
    </div>
  );
};

// Main Editor Component
const Editor = () => {
  const location = useLocation();
  const [projectData,setprojectData] = useState(location?.state?.projectdata || { name: "My Project" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("// Your code editor content will appear here");
  const [users,setusers]=useState([]);
  let [selectedUsers,setSelectedUsers]=useState([]);
  let [ismodalOpen,setismodalopen]=useState(false);
  // Sample messages for demonstration
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "system",
      content: "Welcome to the project chat!",
      timestamp: "10:30 AM",
    },
    {
      id: 2,
      sender: "user",
      content: "Thanks! I'm excited to get started.",
      timestamp: "10:32 AM",
    },
    {
      id: 3,
      sender: "system",
      content: "Let me know if you need any help.",
      timestamp: "10:33 AM",
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log("yes");
    initializeSocket({projectId:projectData._id});
    scrollToBottom();
    axios.get(`/users/usersnotinproject/${projectData._id}`).then(res=>{
      // console.log(res.data);
      setusers(res.data);
    }).catch(err=>{
        console.log(err);
    })
    receiveMessage('project-message',data=>{
      // console.log(data);
      // appendMessage(data);
  })
  }, [messages]);
  const handleUserselection =()=>{
    setismodalopen(false);
    if(selectedUsers.length==0)return;
    axios.put("/projects/add-user",{
      projectid:projectData._id,
      users:selectedUsers
    }).then(()=>{
      console.log("users added successfully");
      axios.get(`/projects/get-project/${projectData._id}`).then(
        (res)=>{
          console.log(res.data);
          setprojectData(res.data);
        }
      )
      setSelectedUsers([]);
    }).catch(err=>console.log(err));
  }
  const handleSendMessage = (message) => {
    if (message.trim()) {
      // Create only one new message (system response was causing duplication)
      const newMessage = {
        id: messages.length + 1,
        sender: "user",
        content: message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMessage]);
      
      // Optionally add a system response after a delay if needed
      // setTimeout(() => {
      //   const systemResponse = {
      //     id: messages.length + 2,
      //     sender: "system",
      //     content: "Received your message!",
      //     timestamp: new Date().toLocaleTimeString([], {
      //       hour: "2-digit",
      //       minute: "2-digit",
      //     }),
      //   };
      //   setMessages(prevMessages => [...prevMessages, systemResponse]);
      // }, 1000);
    }
  };

  // Placeholder suggestions for the vanish input
  const placeholders = [
    "Type your message here...",
    "Share your thoughts...",
    "Ask a question...",
    "Enter your response...",
  ];

  return (
    <div className="font-inter flex h-screen p-4 justify-center w-full bg-gradient-to-br from-[#021227] to-[#015780] select-none overflow-hidden">
      {/* Left sidebar - Messages */}
      <div className="w-[26vw] text-gray-200 p-2 bg-gray-800/40 backdrop-blur-md h-full rounded-lg shadow-2xl overflow-hidden border border-gray-700/50 flex flex-col">
        <div className="bg-gray-800/70 flex justify-between items-center px-4 py-3 rounded-lg shadow-md">
          <span className="text-xl font-semibold text-cyan-50">
            {projectData.name}
          </span>
          <span className="flex space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-cyan-300 hover:text-cyan-100 transition-colors"
            >
              <TbUsers size={22} />
            </button>
            <button 
            onClick={()=>setismodalopen(true)}
            className="text-cyan-300 hover:text-cyan-100 transition-colors">
              <TbUsersPlus size={22} />
            </button>
          </span>
           <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <div className="text-xl font-semibold text-cyan-100 mb-6 border-b border-gray-700 pb-2">
          Project Members
        </div>
        <div className="space-y-4">
          {projectData.users.map(
            (user, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-md transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user.firstname[0]}
                </div>
                <div>
                  <div className="text-gray-200">{user.firstname}</div>
                  <div className="text-xs text-gray-400">
                    {index === 0 ? "Online" : index === 1 ? "Away" : "Offline"}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </Sidebar>
        </div>
        {/* Messages container with TracingBeam */}
        <div className="flex-1 my-2 p-3 overflow-y-auto space-y-4 custom-scrollbar">
          <TracingBeam>
            {messages.map((message) => (
              <Message
                key={message.id}
                sender={message.sender}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            <div ref={messagesEndRef} />
          </TracingBeam>
        </div>

        {/* Input bar - Full width of the message box */}
        <div className="bg-gray-800/50 p-3 rounded-lg w-full">
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onSubmit={handleSendMessage}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="w-[70vw] flex h-full rounded-lg ml-2">
        {/* Secondary sidebar */}
        <div className="w-[18%] bg-gray-800/40 backdrop-blur-md h-full rounded-lg shadow-2xl overflow-hidden border border-gray-700/50 p-3">
          <div className="text-lg font-semibold text-cyan-100 mb-4 border-b border-gray-700 pb-2">
            Project Tools
          </div>

          <div className="space-y-3">
            {["Dashboard", "Documents", "Tasks", "Timeline", "Settings"].map(
              (item, index) => (
                <div
                  key={index}
                  className="p-2 rounded-md text-gray-300 hover:bg-gray-700/60 hover:text-cyan-200 cursor-pointer transition-all"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        {/* Main editor space */}
        <div className="w-[82%] ml-2 h-full rounded-lg flex flex-col gap-2">
          {/* Top panel */}
          <div className="w-full text-white p-4 rounded-lg h-[10%] bg-gray-800/40 backdrop-blur-md shadow-2xl border border-gray-700/50 flex items-center justify-between">
            <div className="text-lg font-semibold text-cyan-100">
              Editor View
            </div>
            <div className="flex space-x-4">
              <button className="px-3 py-1 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-md transition-colors shadow-md">
                Save
              </button>
              <button className="px-3 py-1 bg-gray-700/80 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md">
                Preview
              </button>
            </div>
          </div>

          {/* Bottom panel - Editable */}
          <div className="w-full text-white p-5 rounded-lg h-[90%] bg-gray-800/40 backdrop-blur-md shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="h-full bg-gray-900/50 rounded-lg p-4 text-gray-300 overflow-auto custom-scrollbar">
              <textarea 
                className="w-full h-full bg-transparent font-mono resize-none focus:outline-none focus:ring-0 custom-scrollbar"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Sidebar */}
     
      <UserSelectionModal 
          isOpen={ismodalOpen}
          onClose={handleUserselection}
          users={users}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
        />
      {/* Add custom scrollbar styles */}
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(100, 116, 139, 0.5);
          border-radius: 20px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 0.8);
        }
      `}</style>
    </div>
  );
};

export default Editor;