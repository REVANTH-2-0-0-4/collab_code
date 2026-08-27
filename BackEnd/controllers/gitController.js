import usermodel from "../db/models/user_model.js";
import project_model from "../db/models/project_model.js";
import jwt from "jsonwebtoken";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Iv23liTESTINGCLIENTID";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "TESTINGCLIENTSECRET";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Redirect or return GitHub OAuth URL
 */
export const getGitHubAuthUrl = async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1] || "";
  const redirectUri = `${req.protocol}://${req.get("host")}/git/auth/github/callback`;
  const state = token ? Buffer.from(JSON.stringify({ token })).toString("base64") : "";
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user,read:user,user:email&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  if (req.query.format === "json") {
    return res.json({ url });
  }
  return res.redirect(url);
};

/**
 * Handle GitHub OAuth Callback
 */
export const githubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.redirect(`${FRONTEND_URL}?error=missing_code`);
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/git/auth/github/callback`;

    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Failed to obtain GitHub access token:", tokenData);
      return res.redirect(`${FRONTEND_URL}?error=github_token_exchange_failed`);
    }

    // 2. Fetch GitHub user profile
    const userProfileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "CollabCode-App",
      },
    });

    const githubUser = await userProfileRes.json();

    // 3. Find user from state token if provided, or by githubId / email
    let user = null;
    if (state) {
      try {
        const parsedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
        if (parsedState.token) {
          const decoded = jwt.verify(parsedState.token, process.env.JWT_SECRET);
          user = await usermodel.findOne({ email: decoded.email });
        }
      } catch (err) {
        console.warn("Could not decode state token:", err.message);
      }
    }

    // If not found via state token, check by githubId or email
    if (!user && githubUser.id) {
      user = await usermodel.findOne({ githubId: String(githubUser.id) });
    }

    if (!user && githubUser.email) {
      user = await usermodel.findOne({ email: githubUser.email.toLowerCase() });
    }

    if (user) {
      // Update existing user with GitHub info
      user.githubId = String(githubUser.id);
      user.githubUsername = githubUser.login;
      user.githubAccessToken = accessToken;
      user.githubAvatar = githubUser.avatar_url;
      await user.save();
    } else {
      // Create new user with GitHub profile
      user = await usermodel.create({
        firstname: githubUser.name ? githubUser.name.split(" ")[0] : githubUser.login,
        lastname: githubUser.name && githubUser.name.split(" ").length > 1 ? githubUser.name.split(" ").slice(1).join(" ") : "GitHub",
        email: githubUser.email || `${githubUser.login}@github.collabcode.local`,
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        githubAccessToken: accessToken,
        githubAvatar: githubUser.avatar_url,
      });
    }

    const appToken = user.generateJWT();
    res.cookie("token", appToken, { httpOnly: false });

    return res.redirect(`${FRONTEND_URL}/editor?github_connected=true&token=${appToken}`);
  } catch (error) {
    console.error("githubCallback error:", error);
    return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Get current user's GitHub VCS status & project linked repo
 */
export const getGitStatus = async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { projectId } = req.query;
    let linkedRepo = null;
    if (projectId) {
      const project = await project_model.findById(projectId);
      if (project) {
        linkedRepo = project.githubRepo;
      }
    }

    return res.status(200).json({
      success: true,
      isConnected: Boolean(user.githubAccessToken),
      githubUsername: user.githubUsername || null,
      githubAvatar: user.githubAvatar || null,
      linkedRepo,
    });
  } catch (error) {
    console.error("getGitStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List user's GitHub Repositories
 */
export const getRepos = async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ success: false, message: "GitHub account not connected." });
    }

    const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100&type=all", {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        "User-Agent": "CollabCode-App",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!reposRes.ok) {
      const errorData = await reposRes.json();
      return res.status(reposRes.status).json({ success: false, message: errorData.message || "Failed to fetch repositories" });
    }

    const repos = await reposRes.json();
    const formattedRepos = repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      private: r.private,
      htmlUrl: r.html_url,
      defaultBranch: r.default_branch || "main",
      description: r.description,
    }));

    return res.status(200).json({ success: true, repos: formattedRepos });
  } catch (error) {
    console.error("getRepos error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Link a GitHub repository to a project
 */
export const linkRepo = async (req, res) => {
  try {
    const { projectId, owner, repo, defaultBranch, url } = req.body;
    if (!projectId || !owner || !repo) {
      return res.status(400).json({ success: false, message: "projectId, owner, and repo are required." });
    }

    const project = await project_model.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    project.githubRepo = {
      owner,
      repo,
      defaultBranch: defaultBranch || "main",
      url: url || `https://github.com/${owner}/${repo}`,
    };

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Repository linked successfully",
      linkedRepo: project.githubRepo,
    });
  } catch (error) {
    console.error("linkRepo error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new repository on GitHub and link to project
 */
export const createRepo = async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ success: false, message: "GitHub account not connected." });
    }

    const { projectId, name, description, isPrivate } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Repository name is required." });
    }

    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        "User-Agent": "CollabCode-App",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: description || "Created via CollabCode Collaborative IDE",
        private: Boolean(isPrivate),
        auto_init: true,
      }),
    });

    const repoData = await createRes.json();
    if (!createRes.ok) {
      return res.status(createRes.status).json({ success: false, message: repoData.message || "Failed to create GitHub repository" });
    }

    if (projectId) {
      const project = await project_model.findById(projectId);
      if (project) {
        project.githubRepo = {
          owner: repoData.owner.login,
          repo: repoData.name,
          defaultBranch: repoData.default_branch || "main",
          url: repoData.html_url,
        };
        await project.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Repository created and linked successfully",
      repo: {
        owner: repoData.owner.login,
        repo: repoData.name,
        defaultBranch: repoData.default_branch || "main",
        url: repoData.html_url,
      },
    });
  } catch (error) {
    console.error("createRepo error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Commit and Push files directly to linked GitHub repository using GitHub Git Data API
 */
export const commitAndPush = async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ success: false, message: "GitHub account not connected." });
    }

    const { projectId, commitMessage, files } = req.body;
    if (!commitMessage) {
      return res.status(400).json({ success: false, message: "Commit message is required." });
    }

    const project = await project_model.findById(projectId);
    if (!project || !project.githubRepo || !project.githubRepo.repo) {
      return res.status(400).json({
        success: false,
        message: "No GitHub repository linked to this project. Please link or create a repository first.",
      });
    }

    const { owner, repo, defaultBranch = "main" } = project.githubRepo;
    const token = user.githubAccessToken;
    const headers = {
      Authorization: `Bearer ${token}`,
      "User-Agent": "CollabCode-App",
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    // 1. Convert files (either flat map or fileTree object) into array of { path, content }
    const fileEntries = [];
    const extractFiles = (tree, prefix = "") => {
      for (const [key, val] of Object.entries(tree || {})) {
        const fullPath = prefix ? `${prefix}/${key}` : key;
        if (val && typeof val === "object") {
          if (val.file && typeof val.file.contents === "string") {
            fileEntries.push({ path: fullPath, content: val.file.contents });
          } else if (typeof val.contents === "string") {
            fileEntries.push({ path: fullPath, content: val.contents });
          } else if (typeof val === "string") {
            fileEntries.push({ path: fullPath, content: val });
          } else if (val.directory) {
            extractFiles(val.directory, fullPath);
          }
        }
      }
    };

    extractFiles(files);

    if (fileEntries.length === 0) {
      return res.status(400).json({ success: false, message: "No files found to commit." });
    }

    // 2. Get latest commit and base tree for the branch
    let latestCommitSha = null;
    let baseTreeSha = null;

    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, { headers });

    if (refRes.ok) {
      const refData = await refRes.json();
      latestCommitSha = refData.object.sha;

      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        baseTreeSha = commitData.tree.sha;
      }
    }

    // 3. Create tree entries
    const treePayload = fileEntries.map((f) => ({
      path: f.path,
      mode: "100644",
      type: "blob",
      content: f.content,
    }));

    const createTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tree: treePayload,
        base_tree: baseTreeSha || undefined,
      }),
    });

    const treeData = await createTreeRes.json();
    if (!createTreeRes.ok) {
      return res.status(createTreeRes.status).json({ success: false, message: treeData.message || "Failed to create Git tree" });
    }

    // 4. Create commit
    const authorDetails = {
      name: user.githubUsername || `${user.firstname} ${user.lastname || ""}`.trim(),
      email: user.email,
      date: new Date().toISOString(),
    };

    const createCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: latestCommitSha ? [latestCommitSha] : [],
        author: authorDetails,
        committer: authorDetails,
      }),
    });

    const newCommit = await createCommitRes.json();
    if (!createCommitRes.ok) {
      return res.status(createCommitRes.status).json({ success: false, message: newCommit.message || "Failed to create Git commit" });
    }

    // 5. Update or create branch reference
    if (latestCommitSha) {
      const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          sha: newCommit.sha,
          force: true,
        }),
      });

      if (!updateRefRes.ok) {
        const updateError = await updateRefRes.json();
        return res.status(updateRefRes.status).json({ success: false, message: updateError.message || "Failed to update branch reference" });
      }
    } else {
      // Create reference if new repo
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${defaultBranch}`,
          sha: newCommit.sha,
        }),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Committed and pushed to GitHub successfully!",
      commitSha: newCommit.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
      committedFiles: fileEntries.map((f) => f.path),
    });
  } catch (error) {
    console.error("commitAndPush error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get commit history for the linked GitHub repository
 */
export const getLogs = async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ success: false, message: "GitHub account not connected." });
    }

    const { projectId } = req.query;
    const project = await project_model.findById(projectId);
    if (!project || !project.githubRepo || !project.githubRepo.repo) {
      return res.status(200).json({ success: true, commits: [] });
    }

    const { owner, repo } = project.githubRepo;
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        "User-Agent": "CollabCode-App",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!commitsRes.ok) {
      return res.status(200).json({ success: true, commits: [] });
    }

    const commitsData = await commitsRes.json();
    const commits = (commitsData || []).map((c) => ({
      sha: c.sha,
      shortSha: c.sha.substring(0, 7),
      message: c.commit.message,
      author: {
        name: c.commit.author?.name || c.author?.login || "Unknown",
        avatar: c.author?.avatar_url || null,
        date: c.commit.author?.date,
      },
      htmlUrl: c.html_url,
    }));

    return res.status(200).json({ success: true, commits });
  } catch (error) {
    console.error("getLogs error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Connect user's GitHub using a Personal Access Token (PAT)
 */
export const connectWithToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Personal Access Token is required." });
    }

    const userProfileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "User-Agent": "CollabCode-App",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userProfileRes.ok) {
      const errData = await userProfileRes.json().catch(() => ({}));
      return res.status(401).json({
        success: false,
        message: errData.message || "Invalid GitHub token. Please verify your token permissions.",
      });
    }

    const githubUser = await userProfileRes.json();
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.githubId = String(githubUser.id);
    user.githubUsername = githubUser.login;
    user.githubAccessToken = token.trim();
    user.githubAvatar = githubUser.avatar_url;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "GitHub connected successfully with Personal Access Token!",
      githubUsername: githubUser.login,
      githubAvatar: githubUser.avatar_url,
    });
  } catch (error) {
    console.error("connectWithToken error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Disconnect GitHub account
 */
export const disconnectGitHub = async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.githubAccessToken = null;
    user.githubUsername = null;
    user.githubAvatar = null;
    user.githubId = null;
    await user.save();

    return res.status(200).json({ success: true, message: "GitHub account disconnected." });
  } catch (error) {
    console.error("disconnectGitHub error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
