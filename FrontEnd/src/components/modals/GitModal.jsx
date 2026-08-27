import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGithub, FaCheckCircle, FaSpinner, FaExternalLinkAlt, FaCodeBranch, FaPlus, FaKey } from "react-icons/fa";
import { TbX, TbGitCommit, TbGitBranch, TbGitPullRequest, TbRefresh, TbPlugConnectedX } from "react-icons/tb";
import axios from "@/config/axios.js";

const GitModal = ({ isOpen, onClose, projectId, projectName, fileTree, ydoc }) => {
  const [gitStatus, setGitStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [committing, setCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(null);
  const [commits, setCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [activeTab, setActiveTab] = useState("vcs"); // 'vcs' | 'history'

  // Personal Access Token state
  const [patToken, setPatToken] = useState("");
  const [connectingPat, setConnectingPat] = useState(false);

  const fetchGitStatus = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/git/status?projectId=${projectId}`);
      setGitStatus(res.data);
      if (res.data.linkedRepo) {
        setSelectedRepo(`${res.data.linkedRepo.owner}/${res.data.linkedRepo.repo}`);
      }
    } catch (err) {
      console.error("Error fetching Git status:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchRepos = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const res = await axios.get("/git/repos");
      setRepos(res.data.repos || []);
    } catch (err) {
      console.error("Error fetching repos:", err);
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const fetchCommits = useCallback(async () => {
    if (!projectId) return;
    setLoadingCommits(true);
    try {
      const res = await axios.get(`/git/commits?projectId=${projectId}`);
      setCommits(res.data.commits || []);
    } catch (err) {
      console.error("Error fetching commits:", err);
    } finally {
      setLoadingCommits(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      fetchGitStatus();
      setCommitSuccess(null);
    }
  }, [isOpen, fetchGitStatus]);

  useEffect(() => {
    if (isOpen && gitStatus?.isConnected) {
      fetchRepos();
      if (gitStatus?.linkedRepo) {
        fetchCommits();
      }
    }
  }, [isOpen, gitStatus?.isConnected, gitStatus?.linkedRepo, fetchRepos, fetchCommits]);

  const handleConnectGitHubOAuth = () => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    window.location.href = `${backendUrl}/git/auth/github`;
  };

  const handleConnectWithPat = async (e) => {
    e.preventDefault();
    if (!patToken.trim()) {
      alert("Please enter your GitHub Personal Access Token");
      return;
    }

    setConnectingPat(true);
    try {
      await axios.post("/git/connect-token", { token: patToken.trim() });
      setPatToken("");
      await fetchGitStatus();
    } catch (err) {
      console.error("Error connecting with PAT:", err);
      alert(err.response?.data?.message || "Invalid GitHub token. Please verify token has 'repo' scope.");
    } finally {
      setConnectingPat(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your GitHub account?")) return;
    try {
      await axios.post("/git/disconnect");
      setGitStatus({ isConnected: false });
      setRepos([]);
      setCommits([]);
    } catch (err) {
      console.error("Error disconnecting GitHub:", err);
    }
  };

  const handleLinkRepo = async () => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split("/");
    const repoObj = repos.find((r) => r.owner === owner && r.name === repo);
    try {
      await axios.post("/git/link-repo", {
        projectId,
        owner,
        repo,
        defaultBranch: repoObj?.defaultBranch || "main",
        url: repoObj?.htmlUrl || `https://github.com/${owner}/${repo}`,
      });
      await fetchGitStatus();
      await fetchCommits();
    } catch (err) {
      console.error("Error linking repo:", err);
      alert(err.response?.data?.message || "Failed to link repository");
    }
  };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    try {
      await axios.post("/git/create-repo", {
        projectId,
        name: newRepoName.trim(),
        description: newRepoDescription.trim(),
        isPrivate: newRepoPrivate,
      });
      setIsCreatingRepo(false);
      setNewRepoName("");
      setNewRepoDescription("");
      await fetchGitStatus();
      await fetchRepos();
      await fetchCommits();
    } catch (err) {
      console.error("Error creating repo:", err);
      alert(err.response?.data?.message || "Failed to create repository");
    }
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) {
      alert("Please enter a commit message");
      return;
    }

    setCommitting(true);
    setCommitSuccess(null);

    try {
      const filesPayload = {};
      Object.keys(fileTree || {}).forEach((fileName) => {
        let content = fileTree[fileName]?.file?.contents || "";
        if (ydoc) {
          const yText = ydoc.getText(fileName);
          const yContent = yText.toString();
          if (yContent) {
            content = yContent;
          }
        }
        filesPayload[fileName] = content;
      });

      const res = await axios.post("/git/commit-and-push", {
        projectId,
        commitMessage: commitMessage.trim(),
        files: filesPayload,
      });

      setCommitSuccess(res.data);
      setCommitMessage("");
      await fetchCommits();
    } catch (err) {
      console.error("Error committing and pushing:", err);
      alert(err.response?.data?.message || "Commit and push failed");
    } finally {
      setCommitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-gray-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/90">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-lg text-white">
                <FaGithub size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  GitHub Version Control (VCS)
                </h3>
                <p className="text-xs text-gray-400">Direct Git operations bound to your GitHub repositories</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <TbX size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          {gitStatus?.isConnected && (
            <div className="flex border-b border-gray-800 bg-gray-950/40 px-6 pt-2">
              <button
                onClick={() => setActiveTab("vcs")}
                className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "vcs"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <TbGitCommit size={16} /> Stage & Push
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "history"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <TbGitBranch size={16} /> Commit History ({commits.length})
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                <FaSpinner className="animate-spin text-2xl text-cyan-400" />
                <p className="text-sm">Connecting to GitHub services...</p>
              </div>
            ) : !gitStatus?.isConnected ? (
              /* Not Connected State - Two Options */
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 mx-auto bg-gray-800 rounded-full flex items-center justify-center text-white text-2xl mb-3 shadow-inner">
                    <FaGithub />
                  </div>
                  <h4 className="text-lg font-bold text-white">Connect Your GitHub Account</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Connect your GitHub account to commit, push, create repositories, and inspect commit history.
                  </p>
                </div>

                {/* Option 1: Personal Access Token (Instant & Zero Config) */}
                <div className="p-4 bg-gray-800/70 border border-cyan-500/30 rounded-xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                      <FaKey size={14} />
                      <span>Option 1: Connect with Personal Access Token (Instant)</span>
                    </div>
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-700/60 px-1.5 py-0.5 rounded uppercase font-mono">
                      Recommended
                    </span>
                  </div>

                  <form onSubmit={handleConnectWithPat} className="space-y-3">
                    <input
                      type="password"
                      value={patToken}
                      onChange={(e) => setPatToken(e.target.value)}
                      placeholder="Paste your GitHub token (ghp_...)"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo,user&description=CollabCode%20VCS"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        Generate token on GitHub <FaExternalLinkAlt size={10} />
                      </a>
                      <button
                        type="submit"
                        disabled={connectingPat || !patToken.trim()}
                        className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {connectingPat ? (
                          <>
                            <FaSpinner className="animate-spin" /> Verifying...
                          </>
                        ) : (
                          "Connect Token"
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Option 2: GitHub OAuth App */}
                <div className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <FaGithub size={14} />
                    <span>Option 2: Authorize via GitHub OAuth App</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Requires a registered GitHub OAuth App with matching <code className="text-cyan-300">GITHUB_CLIENT_ID</code> and <code className="text-cyan-300">GITHUB_CLIENT_SECRET</code> in your backend <code className="text-cyan-300">.env</code>.
                  </p>
                  <button
                    onClick={handleConnectGitHubOAuth}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600/70 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaGithub size={16} /> Authorize with GitHub OAuth
                  </button>
                </div>
              </div>
            ) : (
              /* Connected State */
              <>
                {/* User Profile Badge */}
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700/40">
                  <div className="flex items-center space-x-3">
                    {gitStatus.githubAvatar ? (
                      <img
                        src={gitStatus.githubAvatar}
                        alt="GitHub Avatar"
                        className="w-10 h-10 rounded-full border border-cyan-500/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
                        <FaGithub />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <span>@{gitStatus.githubUsername}</span>
                        <span className="text-xs bg-green-950 text-green-400 border border-green-700/60 px-1.5 py-0.5 rounded-full font-normal">
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">GitHub Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={fetchGitStatus}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                      title="Refresh Status"
                    >
                      <TbRefresh size={18} />
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Disconnect GitHub"
                    >
                      <TbPlugConnectedX size={18} />
                    </button>
                  </div>
                </div>

                {activeTab === "vcs" ? (
                  <>
                    {/* Linked Repository Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                          <TbGitBranch size={16} className="text-cyan-400" /> Target GitHub Repository
                        </label>
                        <button
                          onClick={() => setIsCreatingRepo(!isCreatingRepo)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          <FaPlus size={10} /> {isCreatingRepo ? "Select existing repo" : "Create new repo"}
                        </button>
                      </div>

                      {isCreatingRepo ? (
                        <form onSubmit={handleCreateRepo} className="p-4 bg-gray-800/60 rounded-xl space-y-3 border border-gray-700/60">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Repository Name</label>
                            <input
                              type="text"
                              value={newRepoName}
                              onChange={(e) => setNewRepoName(e.target.value)}
                              placeholder={`collabcode-${projectName.toLowerCase().replace(/\s+/g, "-")}`}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Description (optional)</label>
                            <input
                              type="text"
                              value={newRepoDescription}
                              onChange={(e) => setNewRepoDescription(e.target.value)}
                              placeholder="Created from CollabCode Realtime IDE"
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center text-xs text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newRepoPrivate}
                                onChange={(e) => setNewRepoPrivate(e.target.checked)}
                                className="mr-2 rounded border-gray-700"
                              />
                              Private Repository
                            </label>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Create & Link Repo
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                          >
                            <option value="">-- Choose a Repository --</option>
                            {repos.map((r) => (
                              <option key={r.id} value={`${r.owner}/${r.name}`}>
                                {r.fullName} {r.private ? "🔒" : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleLinkRepo}
                            disabled={!selectedRepo}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Link
                          </button>
                        </div>
                      )}

                      {gitStatus.linkedRepo && (
                        <div className="text-xs text-gray-400 flex items-center justify-between px-1">
                          <span>
                            Linked to:{" "}
                            <a
                              href={gitStatus.linkedRepo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                            >
                              {gitStatus.linkedRepo.owner}/{gitStatus.linkedRepo.repo} <FaExternalLinkAlt size={10} />
                            </a>{" "}
                            ({gitStatus.linkedRepo.defaultBranch || "main"})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Staging / Files Preview */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
                        <span>Project Files ({Object.keys(fileTree || {}).length})</span>
                        <span className="text-xs text-green-400">Auto-staged (git add .)</span>
                      </label>
                      <div className="max-h-32 overflow-y-auto bg-gray-950/60 p-3 rounded-lg border border-gray-800 text-xs font-mono space-y-1 custom-scrollbar">
                        {Object.keys(fileTree || {}).length > 0 ? (
                          Object.keys(fileTree).map((file, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-gray-300">
                              <span className="text-green-500 font-bold">+</span>
                              <span>{file}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No project files found</div>
                        )}
                      </div>
                    </div>

                    {/* Commit & Push Section */}
                    <div className="space-y-3 pt-2 border-t border-gray-800">
                      <label className="text-sm font-medium text-gray-300">Commit Message</label>
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder='feat: update code components via CollabCode'
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                      />

                      {commitSuccess && (
                        <div className="p-3 bg-green-950/60 border border-green-700/60 rounded-lg text-xs text-green-300 space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <FaCheckCircle className="text-green-400" /> Pushed to GitHub successfully!
                          </div>
                          <p>
                            Commit SHA:{" "}
                            <a
                              href={commitSuccess.commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 hover:underline font-mono"
                            >
                              {commitSuccess.commitSha?.substring(0, 7)}
                            </a>
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleCommitAndPush}
                        disabled={committing || !gitStatus.linkedRepo || !commitMessage.trim()}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {committing ? (
                          <>
                            <FaSpinner className="animate-spin" /> Pushing to GitHub...
                          </>
                        ) : (
                          <>
                            <TbGitPullRequest size={18} /> Commit & Push (git push)
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  /* History Tab */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-300">Recent Commits</h4>
                      <button
                        onClick={fetchCommits}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <TbRefresh size={14} /> Refresh
                      </button>
                    </div>
                    {loadingCommits ? (
                      <div className="flex items-center justify-center py-8 text-gray-400 space-x-2">
                        <FaSpinner className="animate-spin text-cyan-400" />
                        <span className="text-xs">Loading commit history...</span>
                      </div>
                    ) : commits.length > 0 ? (
                      <div className="space-y-2">
                        {commits.map((c, i) => (
                          <div
                            key={i}
                            className="p-3 bg-gray-800/60 border border-gray-700/50 rounded-lg flex items-start justify-between text-xs"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-white">{c.message}</p>
                              <div className="flex items-center gap-2 text-gray-400">
                                <span>{c.author.name}</span>
                                <span>•</span>
                                <span>{c.author.date ? new Date(c.author.date).toLocaleString() : ""}</span>
                              </div>
                            </div>
                            <a
                              href={c.htmlUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-cyan-400 bg-gray-900 px-2 py-1 rounded border border-gray-700 hover:underline flex items-center gap-1"
                            >
                              {c.shortSha} <FaExternalLinkAlt size={10} />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-xs bg-gray-800/30 rounded-lg">
                        No commit history found for this repository yet.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GitModal;
