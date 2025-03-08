import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TbUsers, TbUsersPlus, TbSend, TbMenu2, TbX } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";

// Utility function for class name merging
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// PlaceholdersAndVanishInput Component
const PlaceholdersAndVanishInput = ({ placeholders, onChange, onSubmit }) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const intervalRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const newDataRef = React.useRef([]);
  const inputRef = React.useRef(null);

  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const draw = React.useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData = [];

    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (
          pixelData[e] !== 0 &&
          pixelData[e + 1] !== 0 &&
          pixelData[e + 2] !== 0
        ) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start) => {
    const animateFrame = (pos = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          setValue("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !animating) {
      vanishAndSubmit();
    }
  };

  const vanishAndSubmit = () => {
    setAnimating(true);
    draw();

    const value = inputRef.current?.value || "";
    if (value && inputRef.current) {
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      animate(maxX);
      onSubmit && onSubmit(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    vanishAndSubmit();
  };

  return (
    <form
      className={cn(
        "w-full relative bg-gray-800/50 h-12 rounded-full overflow-hidden shadow-lg transition duration-200",
        value && "bg-gray-700/70"
      )}
      onSubmit={handleSubmit}
    >
      <canvas
        className={cn(
          "absolute pointer-events-none text-base transform scale-50 top-[20%] left-2 origin-top-left filter invert-0 pr-20",
          !animating ? "opacity-0" : "opacity-100"
        )}
        ref={canvasRef}
      />
      <input
        onChange={(e) => {
          if (!animating) {
            setValue(e.target.value);
            onChange && onChange(e);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={value}
        type="text"
        className={cn(
          "w-full relative text-base z-50 border-none text-gray-100 bg-transparent h-full rounded-full focus:outline-none focus:ring-0 pl-4 pr-14 font-inter",
          animating && "text-transparent"
        )}
      />
      <button
        disabled={!value}
        type="submit"
        className="absolute right-2 top-1/2 z-50 -translate-y-1/2 h-8 w-8 rounded-full disabled:bg-gray-700 bg-cyan-600 disabled:opacity-50 transition duration-200 flex items-center justify-center"
      >
        <TbSend className="text-white h-4 w-4" />
      </button>
      <div className="absolute inset-0 flex items-center rounded-full pointer-events-none">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
              className="text-gray-400 text-base font-inter pl-4 text-left w-[calc(100%-2rem)] truncate"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
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
          className="absolute left-0 top-0 h-full w-[300px] bg-gray-800/95 backdrop-blur-md z-30 shadow-xl rounded-r-lg overflow-hidden"
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
  const projectData = location?.state?.projectdata || { name: "My Project" };
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleSendMessage = (message) => {
    if (message.trim()) {
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
      {/* Left sidebar */}
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
            <button className="text-cyan-300 hover:text-cyan-100 transition-colors">
              <TbUsersPlus size={22} />
            </button>
          </span>
        </div>

        {/* Messages container */}
        <div className="flex-1 my-2 p-3 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {messages.map((message) => (
            <Message
              key={message.id}
              sender={message.sender}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
        </div>

        {/* Input bar */}
        <div className="bg-gray-800/50 p-3 rounded-lg">
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

          {/* Bottom panel */}
          <div className="w-full text-white p-5 rounded-lg h-[90%] bg-gray-800/40 backdrop-blur-md shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="h-full bg-gray-900/50 rounded-lg p-4 text-gray-300 overflow-auto">
              <p className="font-mono">
                // Your code editor content will appear here
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <div className="text-xl font-semibold text-cyan-100 mb-6 border-b border-gray-700 pb-2">
          Project Members
        </div>
        <div className="space-y-4">
          {["Alex Johnson", "Maria Garcia", "Terry Smith", "Dana Lee"].map(
            (user, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-md transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-gray-200">{user}</div>
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
  );
};

export default Editor;
