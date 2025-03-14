import connect from "./db/db.js";
connect();
import express from "express";
import userrouter from "./routes/user.routes.js";
import projectroutes from "./routes/project.routes.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import chatrouter from "./routes/chat.routes.js"
// import airoutes from "./routes/ai.routes.js"
// import usermodel from "./db/models/user_model.js"
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
  })
);
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("ETag", Math.random().toString()); // Prevents 304 responses
  next();
});

// Main server route
app.get("/", (req, res) => {
  res.send("Collab Code main server running here");
});

// User routes
app.get("/users", (req, res) => {
  res.send(" hey from users route - CollabCode");
});
app.use("/projects", projectroutes);
app.use("/users", userrouter);
app.use("/chats",chatrouter);
// app.use("/ai", airoutes);
export default app;
