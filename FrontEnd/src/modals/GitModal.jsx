import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../config/axios.js"; // Adjust the path if needed

const GitModal = ({ isOpen, onClose, projectName, user }) => {
  const [commitMessage, setCommitMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [pushCredentials, setPushCredentials] = useState({
    githubUsername: "",
    githubToken: "",
    remoteUrl: ""
  });
  const [loading, setLoading] = useState(false);

  const initRepo = async () => {
    try {
      const res = await axios.post("/git/init", { projectName });
      alert(res.data.message);
    } catch (error) {
      console.error("Init Repo Error:", error);
      alert("Error initializing repository");
    }
  };

  const commitChanges = async () => {
    if (!commitMessage.trim()) return;
    try {
      const res = await axios.post("/git/commit", { projectName, commitMessage });
      alert("Commit successful: " + res.data.commitId);
    } catch (error) {
      console.error("Commit Error:", error);
      alert("Error committing changes");
    }
  };

  const pushChanges = async () => {
    try {
      const { githubUsername, githubToken, remoteUrl } = pushCredentials;
      const res = await axios.post("/git/push", { projectName, remoteUrl, githubUsername, githubToken });
      alert(res.data.message);
    } catch (error) {
      console.error("Push Error:", error);
      alert("Error pushing changes");
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/git/logs", { params: { projectName } });
      setLogs(res.data.commits);
      setLoading(false);
    } catch (error) {
      console.error("Logs Error:", error);
      setLoading(false);
      alert("Error fetching commit logs");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-gray-800 text-white rounded-lg p-6 w-96 relative">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-300 hover:text-white"
            >
              X
            </button>
            <h2 className="text-xl font-semibold mb-4">Git Operations</h2>
            <div className="space-y-4">
              <button
                onClick={initRepo}
                className="w-full bg-blue-600 py-2 rounded hover:bg-blue-500"
              >
                Initialize Repository
              </button>
              <div>
                <input
                  type="text"
                  placeholder="Commit Message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700"
                />
                <button
                  onClick={commitChanges}
                  className="w-full mt-2 bg-green-600 py-2 rounded hover:bg-green-500"
                >
                  Commit Changes
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Remote URL"
                  value={pushCredentials.remoteUrl}
                  onChange={(e) =>
                    setPushCredentials({ ...pushCredentials, remoteUrl: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-700 mb-2"
                />
                <input
                  type="text"
                  placeholder="GitHub Username"
                  value={pushCredentials.githubUsername}
                  onChange={(e) =>
                    setPushCredentials({ ...pushCredentials, githubUsername: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-700 mb-2"
                />
                <input
                  type="password"
                  placeholder="GitHub Token"
                  value={pushCredentials.githubToken}
                  onChange={(e) =>
                    setPushCredentials({ ...pushCredentials, githubToken: e.target.value })
                  }
                  className="w-full p-2 rounded bg-gray-700"
                />
                <button
                  onClick={pushChanges}
                  className="w-full mt-2 bg-purple-600 py-2 rounded hover:bg-purple-500"
                >
                  Push Changes
                </button>
              </div>
              <div>
                <button
                  onClick={fetchLogs}
                  className="w-full bg-yellow-600 py-2 rounded hover:bg-yellow-500"
                >
                  {loading ? "Loading Logs..." : "View Commit History"}
                </button>
                {logs.length > 0 && (
                  <div className="mt-4 max-h-40 overflow-auto">
                    <h3 className="text-lg font-semibold mb-2">Commit Logs:</h3>
                    <ul className="text-sm">
                      {logs.map((commit, index) => (
                        <li key={index} className="border-b border-gray-600 py-1">
                          <strong>{commit.sha.substring(0, 7)}</strong>: {commit.message}
                          <div className="text-xs text-gray-400">
                            {commit.author.name} on {new Date(commit.date).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GitModal;
