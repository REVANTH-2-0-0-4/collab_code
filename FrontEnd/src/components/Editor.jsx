import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { TbUsers, TbUsersPlus, TbSend, TbX } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";
import PlaceholdersAndVanishInput from "./PlaceholdersAndVanishInput.jsx";
import TracingBeam from "../components/TracingBeam.jsx";
import axios from "../config/axios.js";
import UserSelectionModal from "./modals/UserSelectionModal.jsx";
import { receiveMessage, sendMessage, initializeSocket } from "@/config/socket.js";
import { UserContext } from "@/context/Usercontext.jsx";
import Message from "./Message.jsx";
import { getWebContainer } from "@/config/webcontainer.js"; 

// Utility function for merging class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Sidebar Component for Project Members
const Sidebar = ({ open, setOpen, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute left-0 top-0 h-full w-[400px] bg-gray-800/95 backdrop-blur-md z-30 shadow-xl rounded-r-lg"
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">
            <TbX size={24} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Editor = () => {
  const location = useLocation();
  const [projectData, setProjectData] = useState(location?.state?.projectdata || { name: "My Project" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [webContainer, setWebContainer] = useState(null);

  // --- File Tree States ---
  const [fileTree, setFileTree] = useState({}); // Will be updated from Gemini response
  const [openFiles, setOpenFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getChats = () => {
    axios
      .post("chats/get-chat", { projectid: projectData._id })
      .then((res) => setMessages(res.data))
      .catch((err) => console.log(err));
  };

  // Function to fetch users not in project
  const fetchUsersNotInProject = useCallback(() => {
    axios
      .get(`/users/usersnotinproject/${projectData._id}`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.log(err));
  }, [projectData._id]);

  // Initialize socket, load chats, and fetch users
  useEffect(() => {
    initializeSocket({ projectId: projectData._id });
    if(!webContainer) {
      getWebContainer().then(container => { 
        setWebContainer(container);
        console.log("WebContainer initialized:", container);
      });
    }
    scrollToBottom();
    getChats();
    fetchUsersNotInProject(); // Use the new function

    // Receive messages from socket
    receiveMessage("project-message", (data) => {
      try {
        // Parse Gemini response (expected to be a JSON string)
        const parsed = JSON.parse(data.message);
        // Update file tree if provided
        webContainer?.mount(parsed.fileTree);
        if (parsed.fileTree) {
          // console.log("Received file tree:", parsed);
          // console.log("type of fileTree:", typeof parsed.fileTree);
          setFileTree(parsed.fileTree);
        }
        // Add only the text portion as a chat message
        if (parsed.text) {
          const newChatMsg = {
            project: projectData._id,
            message: parsed.text,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setMessages((prev) => [...prev, newChatMsg]);
        }
      } catch (err) {
        console.error("Error parsing incoming message:", err);
      }
      getChats();
    });
  }, [fetchUsersNotInProject]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUserSelection = () => {
    setIsModalOpen(false);
    if (selectedUsers.length === 0) return;
    
    axios
      .put("/projects/add-user", {
        projectid: projectData._id,
        users: selectedUsers,
      })
      .then(() => {
        // Update project data
        axios.get(`/projects/get-project/${projectData._id}`).then((res) => {
          setProjectData(res.data);
        });
        
        // Refresh the list of users not in project
        fetchUsersNotInProject();
        
        // Clear selected users
        setSelectedUsers([]);
      })
      .catch((err) => console.log(err));
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        project: projectData._id,
        message: message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      axios
        .post("/chats/add-chat", newMessage)
        .then(() => {
          axios
            .post("chats/get-chat", { projectid: projectData._id })
            .then((res) => {
              setMessages(res.data);
              sendMessage("project-message", newMessage);
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
      setMessage("");
    }
  };

  const handleDeleteMessage = (messageId) => {
    axios
      .delete("/chats/delete-chat", { data: { id: messageId } })
      .then(() => {
        getChats();
      })
      .catch((err) => console.log(err));
  };

  const handleEditMessage = (messageId, newContent) => {
    axios
      .put("/chats/edit-chat", { id: messageId, message: newContent })
      .then(() => {
        getChats();
      })
      .catch((err) => console.log(err));
  };

  // --- File Tree Helper Functions ---
  const handleFileSelect = (fileName) => {
    if (!openFiles.includes(fileName)) {
      setOpenFiles((prev) => [...prev, fileName]);
    }
    setCurrentFile(fileName);
  };

  const handleDeleteFileTab = (fileName) => {
    const idx = openFiles.indexOf(fileName);
    if (idx !== -1) {
      setOpenFiles((prev) => prev.filter((f) => f !== fileName));
      if (openFiles.length > 1) {
        const nextFileIdx = idx === openFiles.length - 1 ? idx - 1 : idx;
        setCurrentFile(openFiles[nextFileIdx]);
      } else {
        setCurrentFile(null);
      }
    }
  };

  const handleFileContentUpdate = useCallback(
    (e) => {
      const updatedContent = e.target.innerText;
      if (currentFile && fileTree[currentFile]?.file.contents !== updatedContent) {
        setFileTree((prevTree) => ({
          ...prevTree,
          [currentFile]: {
            file: { contents: updatedContent },
          },
        }));
      }
    },
    [currentFile, fileTree]
  );

  // Handle Run Code functionality
  const handleRunCode = async () => {
    console.log("Running code...");
    const installprocess = await webContainer.spawn("npm", ["install"]);
    installprocess.output.pipeTo(new WritableStream({
      write: (chunk) => console.log(chunk)
    }));
    const runProcess = await webContainer.spawn("npm", ["start"]);
    runProcess.output.pipeTo(new WritableStream({
      write: (chunk) => console.log(chunk)
    }));
    
  };
  


  // --- End File Tree Functions ---

  const placeholders = [
    "Type your message here...",
    "Share your thoughts...",
    "Ask a question...",
    "Enter your response...",
  ];

  return (
    <div className="font-inter flex h-screen p-4 justify-center w-full bg-gradient-to-br from-[#021227] to-[#015780] select-none overflow-hidden">
      {/* Left Sidebar - Chat Messages */}
      <div className="w-[26vw] text-gray-200 p-2 bg-gray-800/40 backdrop-blur-md h-full rounded-lg shadow-2xl overflow-hidden border border-gray-700/50 flex flex-col">
        <div className="bg-gray-800/70 flex justify-between items-center px-4 py-3 rounded-lg shadow-md">
          <span className="text-xl font-semibold text-cyan-50">{projectData.name}</span>
          <span className="flex space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="text-cyan-300 hover:text-cyan-100 transition-colors">
              <TbUsers size={22} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="text-cyan-300 hover:text-cyan-100 transition-colors">
              <TbUsersPlus size={22} />
            </button>
          </span>
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
            <div className="text-xl font-semibold text-cyan-100 mb-6 border-b border-gray-700 pb-2">Project Members</div>
            <div className="space-y-4">
              {projectData.users?.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-md transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.firstname[0]}
                  </div>
                  <div>
                    <div className="text-gray-200">{user.firstname}</div>
                    <div className="text-xs text-gray-400">{index === 0 ? "Online" : index === 1 ? "Away" : "Offline"}</div>
                  </div>
                </div>
              ))}
            </div>
          </Sidebar>
        </div>
        {/* Chat Messages Container */}
        <div className="flex-1 my-2 p-3 overflow-y-auto space-y-4 custom-scrollbar">
          <TracingBeam>
            {messages.map((msg) => (
              <Message
                key={msg._id}
                message={msg}
                sender={msg.email}
                content={msg.message}
                timestamp={msg.createdAt}
                userEmail={user.email}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </TracingBeam>
        </div>
        {/* Input Bar */}
        <div className="bg-gray-800/50 p-3 rounded-lg w-full">
          <PlaceholdersAndVanishInput
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholders={placeholders}
            onSubmit={handleSendMessage}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-[70vw] flex h-full rounded-lg ml-2">
        {/* Secondary Sidebar: File Tree (Project Tools) */}
        <div className="w-[18%] bg-gray-800/40 backdrop-blur-md h-full rounded-lg shadow-2xl overflow-auto border border-gray-700/50 p-3">
          <div className="text-lg font-semibold text-cyan-100 mb-4 border-b border-gray-700 pb-2">Files</div>
          {Object.keys(fileTree).length > 0 ? (
            Object.keys(fileTree).map((file, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 text-gray-300 hover:bg-gray-600/50 p-2 rounded cursor-pointer transition-colors ${
                  currentFile === file ? 'bg-cyan-600/30 text-cyan-200' : ''
                }`}
                onClick={() => handleFileSelect(file)}
              >
                <span className="text-sm">{file}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm">No files available</div>
          )}
        </div>

        {/* Main Editor Space */}
        <div className="w-[82%] ml-2 h-full rounded-lg flex flex-col gap-2">
          {/* Top Panel with Run Button */}
          <div className="w-full text-white p-4 rounded-lg h-[10%] bg-gray-800/40 backdrop-blur-md shadow-2xl border border-gray-700/50 flex items-center justify-between">
            <div className="text-lg font-semibold text-cyan-100">Code Editor</div>
            <div className="flex space-x-4">
              <button 
                onClick={handleRunCode}
                className="px-4 py-2 bg-green-600/80 hover:bg-green-500 text-white rounded-md transition-colors shadow-md font-medium"
              >
                Run
              </button>
            </div>
          </div>
          {/* Code Editor Panel */}
          <div className="w-full text-white p-5 rounded-lg h-[90%] bg-gray-800/40 backdrop-blur-md shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="h-full bg-gray-900/50 rounded-lg p-4 text-gray-300 overflow-hidden flex flex-col">
              {/* Open File Tabs */}
              <div className="flex space-x-2 mb-2">
                {openFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
                      currentFile === file 
                        ? 'bg-cyan-600/50 text-cyan-100' 
                        : 'bg-gray-600/50 hover:bg-gray-500/50'
                    }`}
                    onClick={() => setCurrentFile(file)}
                  >
                    <span>{file}</span>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFileTab(file);
                    }}>
                      <TbX size={14} className="hover:text-red-400 cursor-pointer" />
                    </button>
                  </div>
                ))}
              </div>
              {/* Editable Code Area */}
              <div className="flex-1 bg-gray-700/30 rounded-lg p-2 overflow-auto custom-scrollbar">
                {currentFile ? (
                  <pre className="w-full h-full">
                    <code
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={handleFileContentUpdate}
                      className="font-mono text-sm leading-relaxed block w-full h-full outline-none"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {fileTree[currentFile]?.file?.contents || '// Start coding here...'}
                    </code>
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-lg mb-2">📁</div>
                      <div>Select a file to view its contents</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Modal */}
      <UserSelectionModal
        isOpen={isModalOpen}
        onClose={handleUserSelection}
        users={users}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
      />

      {/* Custom Scrollbar Styles */}
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