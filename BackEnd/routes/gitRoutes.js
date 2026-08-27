import { Router } from "express";
import * as gitController from "../controllers/gitController.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// GitHub OAuth routes (public entry points)
router.get("/auth/github", gitController.getGitHubAuthUrl);
router.get("/auth/github/callback", gitController.githubCallback);

// Protected VCS operations
router.get("/status", auth, gitController.getGitStatus);
router.get("/repos", auth, gitController.getRepos);
router.post("/link-repo", auth, gitController.linkRepo);
router.post("/create-repo", auth, gitController.createRepo);
router.post("/commit-and-push", auth, gitController.commitAndPush);
router.get("/commits", auth, gitController.getLogs);
router.post("/connect-token", auth, gitController.connectWithToken);
router.post("/disconnect", auth, gitController.disconnectGitHub);

export default router;
