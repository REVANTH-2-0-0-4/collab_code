import connect from "./db/db.js";
connect();
import express from "express";
import userrouter from "./routes/user.routes.js";
// import projectroutes from "./routes/project.routes.js"
// import airoutes from "./routes/ai.routes.js"
// import usermodel from "./db/models/user_model.js"
import cors from "cors";
const app = express();
app.use(cors());
import morgan from "morgan";
import cookieParser from "cookie-parser";
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Main server route
app.get("/", (req, res) => {
    res.send("Collab Code main server running here");
})

// User routes
app.get("/users", (req, res) => {
    res.send(" hey from users route - CollabCode");
})

app.listen(3000,()=>{
    console.log("server is running on the port 3000");
})
// app.use("/projects", projectroutes);
app.use("/users", userrouter);
// app.use("/ai", airoutes);
export default app;