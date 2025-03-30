import nodegit from "nodegit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Support for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes a Git repository for the given project.
 */
export const initRepo = async (req, res) => {
  try {
    const { projectName } = req.body;
    // Define the project directory where code lives
    const projectPath = path.join(__dirname, "../../projects", projectName);

    // Ensure the directory exists; create it recursively if not.
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Initialize a repository if not already present
    const repo = await nodegit.Repository.init(projectPath, 0);
    return res.status(200).json({
      success: true,
      message: "Repository initialized",
      repoPath: projectPath
    });
  } catch (err) {
    console.error("initRepo error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Stages all changes and creates a new commit with the provided commit message.
 */
export const commitChanges = async (req, res) => {
  try {
    const { projectName, commitMessage } = req.body;
    const projectPath = path.join(__dirname, "../../projects", projectName);

    // Check if project directory exists
    if (!fs.existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: "Project repository does not exist. Please initialize it first."
      });
    }

    const repo = await nodegit.Repository.open(projectPath);

    // Stage all changes
    const index = await repo.refreshIndex();
    await index.addAll();
    await index.write();
    const treeOid = await index.writeTree();

    // Create a signature (ideally, retrieve user data from your auth system)
    const author = nodegit.Signature.now("Collab User", "user@example.com");
    const committer = author;
    let parent = null;
    try {
      parent = await repo.getHeadCommit();
    } catch (e) {
      // No previous commit; this is the initial commit
      parent = null;
    }

    // Create commit (if there is no parent, create initial commit)
    const commitId = await repo.createCommit(
      "HEAD",
      author,
      committer,
      commitMessage,
      treeOid,
      parent ? [parent] : []
    );

    return res.status(200).json({
      success: true,
      commitId: commitId.tostrS(),
      message: "Changes committed successfully"
    });
  } catch (err) {
    console.error("commitChanges error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Retrieves the commit history (similar to git log) for the given project.
 */
export const getLogs = async (req, res) => {
  try {
    const { projectName } = req.query;
    const projectPath = path.join(__dirname, "../../projects", projectName);

    // Check if project directory exists
    if (!fs.existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: "Project repository does not exist. Please initialize it first."
      });
    }

    const repo = await nodegit.Repository.open(projectPath);
    const firstCommit = await repo.getMasterCommit();
    const history = firstCommit.history(nodegit.Revwalk.SORT.Time);
    const commits = [];

    await new Promise((resolve, reject) => {
      history.on("commit", (commit) => {
        commits.push({
          sha: commit.sha(),
          author: {
            name: commit.author().name(),
            email: commit.author().email()
          },
          date: commit.date(),
          message: commit.message()
        });
      });
      history.on("end", resolve);
      history.on("error", reject);
      history.start();
    });

    return res.status(200).json({ success: true, commits });
  } catch (err) {
    console.error("getLogs error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Pushes changes from the local repository to the remote repository.
 * Expects remoteUrl in the request body.
 * Uses GitHub credentials from the request body or falls back to environment variables.
 */
export const pushChanges = async (req, res) => {
  try {
    const { projectName, remoteUrl, githubUsername, githubToken } = req.body;
    // Use provided credentials or fallback to environment variables.
    const username = githubUsername || process.env.GITHUB_USERNAME;
    const token = githubToken || process.env.GITHUB_TOKEN;

    const projectPath = path.join(__dirname, "../../projects", projectName);

    // Check if project directory exists
    if (!fs.existsSync(projectPath)) {
      return res.status(400).json({
        success: false,
        message: "Project repository does not exist. Please initialize it first."
      });
    }

    const repo = await nodegit.Repository.open(projectPath);

    // Get the remote 'origin'; if not present, create it.
    let remote;
    try {
      remote = await repo.getRemote("origin");
    } catch {
      remote = await nodegit.Remote.create(repo, "origin", remoteUrl);
    }

    // Push to remote using provided credentials
    await remote.push(
      ["refs/heads/master:refs/heads/master"],
      {
        callbacks: {
          credentials: () => {
            return nodegit.Cred.userpassPlaintextNew(username, token);
          }
        }
      }
    );
    return res.status(200).json({ success: true, message: "Pushed to remote successfully" });
  } catch (err) {
    console.error("pushChanges error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
