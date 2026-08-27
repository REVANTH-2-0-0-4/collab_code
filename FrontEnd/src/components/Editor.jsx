import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { TbUsers, TbUsersPlus, TbSend, TbX, TbRobot, TbGitBranch, TbArrowBackUp, TbCheck, TbSparkles } from "react-icons/tb";
import { FaGithub, FaLock, FaUsers, FaUserAstronaut, FaSpinner, FaMagic, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import MonacoEditor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import PlaceholdersAndVanishInput from "./PlaceholdersAndVanishInput.jsx";
import TracingBeam from "../components/TracingBeam.jsx";
import axios from "../config/axios.js";
import UserSelectionModal from "./modals/UserSelectionModal.jsx";
import IframeModal from "./modals/IframeModal.jsx";
import GitModal from "./modals/GitModal.jsx";
import { receiveMessage, sendMessage, initializeSocket } from "@/config/socket.js";
import { UserContext } from "@/context/Usercontext.jsx";
import Message from "./Message.jsx";
import { getWebContainer } from "@/config/webcontainer.js";

// Utility function for merging class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

const getLanguage = (fileName) => {
  if (!fileName) return "javascript";
  if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "javascript";
  if (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) return "typescript";
  if (fileName.endsWith(".html")) return "html";
  if (fileName.endsWith(".css")) return "css";
  if (fileName.endsWith(".json")) return "json";
  if (fileName.endsWith(".md")) return "markdown";
  if (fileName.endsWith(".py")) return "python";
  if (fileName.endsWith(".cpp") || fileName.endsWith(".c") || fileName.endsWith(".h")) return "cpp";
  return "plaintext";
};

const buildWebContainerTree = (flatTree) => {
  if (!flatTree) return {};
  const tree = {};
  for (const [path, node] of Object.entries(flatTree)) {
    const parts = path.split("/");
    let currentLevel = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!currentLevel[part]) {
        currentLevel[part] = { directory: {} };
      }
      currentLevel = currentLevel[part].directory;
    }
    currentLevel[parts[parts.length - 1]] = node;
  }
  return tree;
};

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
  const params = useParams();
  const navigate = useNavigate();

  // Mode: 'collaborative' | 'individual'
  const [workspaceMode, setWorkspaceMode] = useState(location?.state?.mode || "collaborative");
  const [projectData, setProjectData] = useState(location?.state?.projectdata || null);
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

  // --- Real-time AI File Locking state ---
  const [isFileLocked, setIsFileLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("AI is generating code updates...");

  // --- Individual Mode AI Assistant state ---
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I'm your private Gemini AI Assistant in your Individual Workspace. Ask me to debug, explain, refactor, or generate code without affecting your team's main branch.",
    },
  ]);
  const aiChatEndRef = useRef(null);

  // --- Push to Main State ---
  const [pushingToMain, setPushingToMain] = useState(false);
  const [pushToMainSuccess, setPushToMainSuccess] = useState(false);

  // --- File Tree States ---
  const [fileTree, setFileTree] = useState(location?.state?.fileTree || {});
  const [openFiles, setOpenFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [isIframeModalOpen, setIsIframeModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);

  const fileTreeRef = useRef(fileTree);
  const ydocRef = useRef(new Y.Doc());
  const providerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    fileTreeRef.current = fileTree;
  }, [fileTree]);

  // Resolve project data if not passed in location state
  useEffect(() => {
    if (projectData) return;

    let id = params.projectId;
    if (!id) {
      const search = new URLSearchParams(location.search);
      id = search.get("id") || search.get("projectId");
    }
    if (!id) {
      const parts = location.pathname.split("/");
      if (parts.length > 2 && parts[2]) id = parts[2];
    }

    if (id) {
      axios
        .get(`/projects/get-project/${id}`)
        .then((res) => {
          setProjectData(res.data);
          if (res.data?.fileTree) {
            setFileTree(res.data.fileTree);
          }
        })
        .catch((err) => console.log(err));
    }
  }, [location, params, projectData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getChats = () => {
    if (!projectData?._id) return;
    axios
      .post("chats/get-chat", { projectid: projectData._id })
      .then((res) => setMessages(res.data))
      .catch((err) => console.log(err));
  };

  // Setup Yjs WebSocket provider (ONLY in Collaborative Mode)
  useEffect(() => {
    if (!projectData?._id) return;

    // Disconnect any existing provider
    if (providerRef.current) {
      providerRef.current.disconnect();
      providerRef.current.destroy();
      providerRef.current = null;
    }

    if (workspaceMode === "collaborative") {
      const ydoc = ydocRef.current;
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const wsUrl = baseUrl.replace(/^http/, "ws") + "/yjs";
      const roomName = `project-${projectData._id}`;

      const provider = new WebsocketProvider(wsUrl, roomName, ydoc);
      providerRef.current = provider;
    }

    return () => {
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [projectData?._id, workspaceMode]);

  // Sync Monaco Editor with active file in Yjs
  useEffect(() => {
    if (!editorRef.current || !currentFile) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const ydoc = ydocRef.current;
    const yText = ydoc.getText(currentFile);

    // If yText is empty but fileTree has contents, seed it into Yjs
    if (yText.toString().length === 0 && fileTree[currentFile]?.file?.contents) {
      ydoc.transact(() => {
        yText.insert(0, fileTree[currentFile].file.contents);
      });
    }

    const model = editorRef.current.getModel();
    if (model) {
      const binding = new MonacoBinding(
        yText,
        model,
        new Set([editorRef.current]),
        workspaceMode === "collaborative" ? providerRef.current?.awareness : undefined
      );
      bindingRef.current = binding;
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [currentFile, projectData?._id, workspaceMode]);

  // Handle file locking in Monaco Editor
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: isFileLocked });
    }
  }, [isFileLocked]);

  useEffect(() => {
    if (!projectData?._id) return;

    const fetchProjectFileTree = async () => {
      try {
        const res = await axios.get(`/projects/get-project/${projectData._id}`);
        if (res.data?.fileTree) {
          setFileTree(res.data.fileTree);
          fileTreeRef.current = res.data.fileTree;

          const ydoc = ydocRef.current;
          Object.entries(res.data.fileTree).forEach(([fileName, node]) => {
            const yText = ydoc.getText(fileName);
            if (yText.toString().length === 0 && node?.file?.contents) {
              ydoc.transact(() => {
                yText.insert(0, node.file.contents);
              });
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchProjectFileTree();

    const handleBeforeUnload = () => {
      if (workspaceMode === "collaborative") {
        axios
          .put(`/projects/update-filetree/${projectData._id}`, { fileTree: getFullSerializedTree() })
          .catch((err) => console.log(err));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [projectData?._id, workspaceMode]);

  const getFullSerializedTree = () => {
    const ydoc = ydocRef.current;
    const tree = { ...fileTreeRef.current };
    Object.keys(tree).forEach((fileName) => {
      const yText = ydoc.getText(fileName);
      const content = yText.toString();
      if (content) {
        tree[fileName] = { file: { contents: content } };
      }
    });
    return tree;
  };

  const fetchUsersNotInProject = useCallback(() => {
    if (!projectData?._id) return;
    axios
      .get(`/users/usersnotinproject/${projectData._id}`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.log(err));
  }, [projectData]);

  // Socket listener for chat, AI messages, and real-time file locking
  useEffect(() => {
    if (!projectData?._id) return;
    initializeSocket({ projectId: projectData._id });

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
      });
    }

    scrollToBottom();
    getChats();
    fetchUsersNotInProject();

    // Listen for file-locked and file-unlocked
    receiveMessage("file-locked", (data) => {
      if (workspaceMode === "collaborative") {
        setIsFileLocked(true);
        if (data?.message) setLockMessage(data.message);
      }
    });

    receiveMessage("file-unlocked", () => {
      if (workspaceMode === "collaborative") {
        setIsFileLocked(false);
      }
    });

    // Receive messages from socket
    receiveMessage("project-message", (data) => {
      try {
        let cleanMessage = data.message;
        if (typeof cleanMessage === "string") {
          const match = cleanMessage.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) {
            cleanMessage = match[1];
          }
        }
        const parsed = JSON.parse(cleanMessage);

        if (parsed.fileTree && workspaceMode === "collaborative") {
          const ydoc = ydocRef.current;
          Object.entries(parsed.fileTree).forEach(([fileName, fileObj]) => {
            const newContents = fileObj?.file?.contents;
            if (typeof newContents === "string") {
              const yText = ydoc.getText(fileName);
              if (yText.toString() !== newContents) {
                ydoc.transact(() => {
                  yText.delete(0, yText.length);
                  yText.insert(0, newContents);
                });
              }
            }
          });

          webContainer?.mount(buildWebContainerTree(parsed.fileTree)).catch((err) =>
            console.error("Mount error:", err)
          );
          setFileTree(parsed.fileTree);
        }

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
        // Not a JSON message, just regular chat update
      }
      getChats();
    });
  }, [fetchUsersNotInProject, projectData?._id, workspaceMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChatHistory]);

  useEffect(() => {
    if (iframeUrl) {
      setIsIframeModalOpen(true);
    }
  }, [iframeUrl]);

  const handleUserSelection = () => {
    if (!projectData?._id) return;
    setIsModalOpen(false);
    if (selectedUsers.length === 0) return;

    axios
      .put("/projects/add-user", {
        projectid: projectData._id,
        users: selectedUsers,
      })
      .then(() => {
        axios.get(`/projects/get-project/${projectData._id}`).then((res) => {
          setProjectData(res.data);
        });
        fetchUsersNotInProject();
        setSelectedUsers([]);
      })
      .catch((err) => console.log(err));
  };

  const handleSendMessage = () => {
    if (!projectData?._id) return;
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

  // --- Individual AI Assistant Queries ---
  const handleSendAiPrompt = async (e) => {
    e?.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    const userPrompt = aiPrompt.trim();
    setAiPrompt("");
    setAiChatHistory((prev) => [...prev, { role: "user", text: userPrompt }]);
    setAiLoading(true);

    try {
      const ydoc = ydocRef.current;
      const currentContent = currentFile ? ydoc.getText(currentFile).toString() || fileTree[currentFile]?.file?.contents || "" : "";

      const res = await axios.post("/ai/chat", {
        prompt: userPrompt,
        currentFile: currentFile || null,
        fileContent: currentContent,
      });

      const responseData = res.data?.data;
      const responseText = responseData?.text || res.data?.raw || "Completed AI analysis.";

      setAiChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: responseText,
          data: responseData,
        },
      ]);
    } catch (err) {
      console.error("AI Query Error:", err);
      setAiChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Sorry, there was an error processing your request with Gemini. Please try again.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiFileTree = (aiData) => {
    if (!aiData?.fileTree) return;
    const ydoc = ydocRef.current;

    Object.entries(aiData.fileTree).forEach(([fileName, fileObj]) => {
      const newContents = fileObj?.file?.contents;
      if (typeof newContents === "string") {
        const yText = ydoc.getText(fileName);
        ydoc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, newContents);
        });
      }
    });

    setFileTree((prev) => ({
      ...prev,
      ...aiData.fileTree,
    }));
    alert("Applied AI generated files to your individual workspace!");
  };

  // --- Push to Main Branch (Individual Mode) ---
  const handlePushToMain = async () => {
    if (!projectData?._id) return;
    setPushingToMain(true);
    try {
      const fullTree = getFullSerializedTree();
      await axios.put(`/projects/update-filetree/${projectData._id}`, { fileTree: fullTree });

      // Notify collaborators on socket
      sendMessage("project-message", {
        message: JSON.stringify({
          text: `🚀 Updates merged into Main Branch from individual workspace by ${user?.firstname || "User"}.`,
          fileTree: fullTree,
        }),
        sender: user,
      });

      setPushToMainSuccess(true);
      setTimeout(() => setPushToMainSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to push to main:", err);
      alert("Failed to push changes to Main Branch");
    } finally {
      setPushingToMain(false);
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

  const handleRunCode = async () => {
    console.log("Running code with serialized Yjs state...");

    const ydoc = ydocRef.current;
    const serializedFileTree = { ...fileTree };

    Object.keys(serializedFileTree).forEach((fileName) => {
      const yText = ydoc.getText(fileName);
      const content = yText.toString();
      serializedFileTree[fileName] = {
        file: {
          contents: content || serializedFileTree[fileName]?.file?.contents || "",
        },
      };
    });

    if (webContainer) {
      await webContainer.mount(buildWebContainerTree(serializedFileTree));
    }

    webContainer?.on("server-ready", (port, url) => {
      setIframeUrl(url);
      console.log(`Server is ready at ${url}, port: ${port}`);
    });

    const installprocess = await webContainer?.spawn("npm", ["install"]);
    installprocess?.output?.pipeTo(
      new WritableStream({
        write: (chunk) => console.log(chunk),
      })
    );

    const exitCode = await installprocess?.exit;
    if (exitCode !== 0) {
      console.error("Installation failed");
      return;
    }

    const runProcess = await webContainer?.spawn("npm", ["start"]);
    runProcess?.output?.pipeTo(
      new WritableStream({
        write: (chunk) => console.log(chunk),
      })
    );
  };

  const handleCloseIframeModal = () => {
    setIsIframeModalOpen(false);
  };

  const handleIframeUrlChange = (newUrl) => {
    setIframeUrl(newUrl);
  };

  const placeholders = [
    "Type your message here...",
    "Share thoughts with team...",
    "Type @ai to generate code...",
  ];

  return (
    <div className="font-inter flex h-screen p-4 justify-center w-full bg-gradient-to-br from-[#021227] to-[#015780] select-none overflow-hidden">
      {/* Left Sidebar - Team Chat (Collaborative) OR Gemini Assistant (Individual) */}
      <div className="w-[28vw] text-gray-200 p-2 bg-gray-800/40 backdrop-blur-md h-full rounded-lg shadow-2xl overflow-hidden border border-gray-700/50 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800/70 flex justify-between items-center px-4 py-3 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-lg font-semibold text-cyan-50 truncate">{projectData?.name || "Project"}</span>
            {workspaceMode === "collaborative" ? (
              <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-700/60 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <FaUsers size={10} /> Collab
              </span>
            ) : (
              <span className="text-xs bg-purple-950 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <FaUserAstronaut size={10} /> Isolated
              </span>
            )}
          </div>

          <span className="flex space-x-2">
            {workspaceMode === "collaborative" && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 text-cyan-300 hover:text-cyan-100 hover:bg-gray-700/50 rounded-md transition-colors"
                  title="Project Members"
                >
                  <TbUsers size={20} />
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-1.5 text-cyan-300 hover:text-cyan-100 hover:bg-gray-700/50 rounded-md transition-colors"
                  title="Add Members"
                >
                  <TbUsersPlus size={20} />
                </button>
              </>
            )}
          </span>

          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
            <div className="text-xl font-semibold text-cyan-100 mb-6 border-b border-gray-700 pb-2">
              Project Members
            </div>
            <div className="space-y-4">
              {projectData?.users?.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-md transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {member.firstname ? member.firstname[0] : "U"}
                  </div>
                  <div>
                    <div className="text-gray-200">{member.firstname}</div>
                    <div className="text-xs text-gray-400">
                      {index === 0 ? "Online" : index === 1 ? "Away" : "Offline"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Sidebar>
        </div>

        {/* Content Area for Left Sidebar */}
        {workspaceMode === "collaborative" ? (
          /* COLLABORATIVE MODE: Team Chat */
          <>
            <div className="flex-1 my-2 p-3 overflow-y-auto space-y-4 custom-scrollbar">
              <TracingBeam>
                {messages.map((msg) => (
                  <Message
                    key={msg._id}
                    message={msg}
                    sender={msg.email}
                    content={msg.message}
                    timestamp={msg.createdAt}
                    userEmail={user?.email}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onDelete={handleDeleteMessage}
                    onEdit={handleEditMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </TracingBeam>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg w-full">
              <PlaceholdersAndVanishInput
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholders={placeholders}
                onSubmit={handleSendMessage}
              />
            </div>
          </>
        ) : (
          /* INDIVIDUAL MODE: Dedicated Gemini AI Assistant */
          <div className="flex-1 my-2 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {aiChatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs space-y-2 leading-relaxed ${
                    chat.role === "user"
                      ? "bg-purple-900/50 border border-purple-700/50 text-purple-100 ml-4"
                      : "bg-gray-900/80 border border-gray-700/60 text-gray-200 mr-2"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] text-gray-400">
                    {chat.role === "assistant" ? (
                      <span className="text-purple-400 flex items-center gap-1">
                        <TbSparkles size={14} /> Gemini AI
                      </span>
                    ) : (
                      <span className="text-cyan-300">You</span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{chat.text}</p>

                  {chat.data?.fileTree && (
                    <div className="pt-2 border-t border-gray-700/50">
                      <button
                        onClick={() => handleApplyAiFileTree(chat.data)}
                        className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-md shadow flex items-center justify-center gap-1.5 transition-colors text-xs"
                      >
                        <FaMagic size={11} /> Apply AI Code to Workspace
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 text-xs text-purple-300 flex items-center gap-2">
                  <FaSpinner className="animate-spin text-purple-400" />
                  <span>Gemini is analyzing your request...</span>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>

            {/* AI Prompt Input Bar */}
            <form onSubmit={handleSendAiPrompt} className="p-2 bg-gray-900/80 rounded-xl border border-gray-700/50 flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask Gemini to debug, refactor, or write code..."
                className="flex-1 bg-transparent px-2 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiPrompt.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
              >
                <TbSend size={15} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="w-[68vw] flex h-full rounded-lg ml-2">
        {/* Secondary Sidebar: File Tree */}
        <div className="w-[18%] bg-gray-800/40 backdrop-blur-md h-full rounded-lg shadow-2xl overflow-auto border border-gray-700/50 p-3">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <div className="text-lg font-semibold text-cyan-100">Files</div>
            <button
              onClick={() => {
                const fileName = prompt("Enter new file name (e.g., app.js, index.html):");
                if (fileName) {
                  setFileTree((prev) => ({
                    ...prev,
                    [fileName]: { file: { contents: "" } },
                  }));
                  if (!openFiles.includes(fileName)) {
                    setOpenFiles((prev) => [...prev, fileName]);
                  }
                  setCurrentFile(fileName);
                }
              }}
              className="text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer text-lg font-bold"
              title="New File"
            >
              +
            </button>
          </div>
          {Object.keys(fileTree).length > 0 ? (
            Object.keys(fileTree).map((file, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 text-gray-300 hover:bg-gray-600/50 p-2 rounded cursor-pointer transition-colors ${
                  currentFile === file ? "bg-cyan-600/30 text-cyan-200 font-medium" : ""
                }`}
                onClick={() => handleFileSelect(file)}
              >
                <span className="text-sm truncate">{file}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm">No files available</div>
          )}
        </div>

        {/* Main Editor Space */}
        <div className="w-[82%] ml-2 h-full rounded-lg flex flex-col gap-2">
          {/* Top Panel with Mode Toggle & Action Buttons */}
          <div className="w-full text-white p-3 rounded-lg h-[11%] bg-gray-800/40 backdrop-blur-md shadow-2xl border border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Workspace Mode Badge / Switcher */}
              <div className="flex items-center bg-gray-900/80 p-1 rounded-lg border border-gray-700/60">
                <button
                  onClick={() => setWorkspaceMode("collaborative")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    workspaceMode === "collaborative"
                      ? "bg-cyan-600 text-white shadow"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  title="Switch to Realtime Shared Mode"
                >
                  <FaUsers size={12} /> Collaborative
                </button>
                <button
                  onClick={() => setWorkspaceMode("individual")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    workspaceMode === "individual"
                      ? "bg-purple-600 text-white shadow"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  title="Switch to Isolated AI-assisted Sandbox"
                >
                  <FaUserAstronaut size={12} /> Individual
                </button>
              </div>

              {currentFile && (
                <span className="text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded font-mono">
                  {currentFile}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Push to Main Branch (Individual Mode only) */}
              {workspaceMode === "individual" && (
                <button
                  onClick={handlePushToMain}
                  disabled={pushingToMain}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-md transition-colors shadow-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 border border-purple-500/50"
                  title="Merge your isolated changes into the Main Branch"
                >
                  {pushingToMain ? (
                    <>
                      <FaSpinner className="animate-spin" /> Pushing...
                    </>
                  ) : (
                    <>
                      <TbArrowBackUp size={15} /> Push to Main
                    </>
                  )}
                </button>
              )}

              {/* GitHub VCS Button */}
              <button
                onClick={() => setIsGitModalOpen(true)}
                className="px-3.5 py-1.5 bg-gray-700/80 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md text-xs font-medium cursor-pointer flex items-center gap-1.5 border border-gray-600/50"
                title="GitHub Version Control"
              >
                <FaGithub size={14} />
                <span>Git VCS</span>
              </button>

              {/* WebContainer Run Button */}
              <button
                onClick={handleRunCode}
                className="px-4 py-1.5 bg-green-600/80 hover:bg-green-500 text-white rounded-md transition-colors shadow-md text-xs font-semibold cursor-pointer"
              >
                Run
              </button>
            </div>
          </div>

          {/* Success toast for Push to Main */}
          {pushToMainSuccess && (
            <div className="px-4 py-2 bg-purple-950/90 border border-purple-500/60 rounded-lg text-xs text-purple-200 flex items-center gap-2">
              <FaCheckCircle className="text-purple-400" />
              <span>Successfully merged isolated changes to Main Branch & broadcasted to team!</span>
            </div>
          )}

          {/* Code Editor Panel */}
          <div className="w-full text-white p-4 rounded-lg h-[89%] bg-gray-800/40 backdrop-blur-md shadow-2xl border border-gray-700/50 overflow-hidden flex flex-col">
            {/* Real-time AI File Lock Banner (Collaborative Mode) */}
            {isFileLocked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 px-3 py-2 bg-amber-950/80 border border-amber-500/60 rounded-lg text-xs text-amber-300 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FaLock className="animate-pulse text-amber-400" />
                  <span>{lockMessage} (Editor temporarily set to read-only)</span>
                </div>
                <FaSpinner className="animate-spin text-amber-400" />
              </motion.div>
            )}

            {/* Open File Tabs */}
            <div className="flex space-x-2 mb-2 overflow-x-auto pb-1 custom-scrollbar">
              {openFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm cursor-pointer transition-colors ${
                    currentFile === file
                      ? "bg-cyan-600/50 text-cyan-100 font-medium"
                      : "bg-gray-600/50 hover:bg-gray-500/50 text-gray-300"
                  }`}
                  onClick={() => setCurrentFile(file)}
                >
                  <span className="truncate max-w-[150px]">{file}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFileTab(file);
                    }}
                    className="ml-1"
                  >
                    <TbX size={14} className="hover:text-red-400 cursor-pointer" />
                  </button>
                </div>
              ))}
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 rounded-lg overflow-hidden border border-gray-700/40 relative">
              {currentFile ? (
                <MonacoEditor
                  height="100%"
                  language={getLanguage(currentFile)}
                  theme="vs-dark"
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                  }}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                    readOnly: isFileLocked,
                    padding: { top: 8, bottom: 8 },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 bg-gray-900/60">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📁</div>
                    <div>Select a file from the sidebar to start collaborating</div>
                  </div>
                </div>
              )}
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

      {/* Iframe Preview Modal */}
      <IframeModal
        isOpen={isIframeModalOpen}
        onClose={handleCloseIframeModal}
        iframeUrl={iframeUrl}
        onUrlChange={handleIframeUrlChange}
      />

      {/* GitHub VCS Modal */}
      <GitModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        projectId={projectData?._id}
        projectName={projectData?.name || "Project"}
        fileTree={fileTree}
        ydoc={ydocRef.current}
      />

      {/* Custom Scrollbar Styles */}
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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