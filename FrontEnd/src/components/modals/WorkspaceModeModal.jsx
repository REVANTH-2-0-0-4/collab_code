import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbUsers, TbUser, TbX, TbCode, TbRobot, TbGitBranch } from "react-icons/tb";
import { FaUsers, FaUserAstronaut, FaLock } from "react-icons/fa";

const WorkspaceModeModal = ({ isOpen, onClose, project, onSelectMode }) => {
  if (!isOpen || !project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-gray-900 border border-gray-700/70 rounded-2xl shadow-2xl overflow-hidden p-6 text-gray-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <TbX size={20} />
          </button>

          {/* Header */}
          <div className="text-center mb-6 space-y-2">
            <span className="px-3 py-1 bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded-full text-xs font-semibold uppercase tracking-wider">
              Workspace Mode Selection
            </span>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              {project.name}
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Select how you want to open this workspace. You can seamlessly switch modes anytime from inside the editor.
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {/* Mode A: Collaborative */}
            <div
              onClick={() => onSelectMode("collaborative")}
              className="group p-5 bg-gradient-to-br from-gray-800/60 to-gray-900/80 hover:from-cyan-950/40 hover:to-blue-950/40 border border-gray-700/60 hover:border-cyan-500/60 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-cyan-950/30 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <FaUsers size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                    All Collaborative
                  </h3>
                  <span className="text-xs text-cyan-400 font-mono">Main Branch</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Join the live shared environment. Real-time CRDT synchronization via Yjs, live member presence, shared chat, and synchronized AI file locking.
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-gray-700/40 flex items-center justify-between text-xs text-cyan-400 font-medium">
                <span>Enter Shared Room</span>
                <span>→</span>
              </div>
            </div>

            {/* Mode B: Individual */}
            <div
              onClick={() => onSelectMode("individual")}
              className="group p-5 bg-gradient-to-br from-gray-800/60 to-gray-900/80 hover:from-purple-950/40 hover:to-indigo-950/40 border border-gray-700/60 hover:border-purple-500/60 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-purple-950/30 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <FaUserAstronaut size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                    Individual Workspace
                  </h3>
                  <span className="text-xs text-purple-400 font-mono">Isolated Sandbox</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Private cloned instance disconnected from the shared WebSocket room. Query Google Gemini AI exclusively, experiment freely, and push changes to Main or GitHub when ready.
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-gray-700/40 flex items-center justify-between text-xs text-purple-400 font-medium">
                <span>Enter Isolated Mode</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkspaceModeModal;
