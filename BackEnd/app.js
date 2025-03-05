import connect from "./db/db.js";
connect();
import express from "express";
// import userrouter from "./routes/user.routes.js"
// import projectroutes from "./routes/project.routes.js"
// import airoutes from "./routes/ai.routes.js"
import usermodel from "./db/models/user_model.js"
import cors from "cors";
const app = express();
app.use(cors());
import morgan from "morgan";
import cookieParser from "cookie-parser";
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send(" haa chal raha hai beta");
})
app.post('/createuser', async (req, res) => {
    const {firstname,lastname,email,password} = req.body;
    const user = await usermodel.create({
        firstname,
        lastname,
        email,
        password: await usermodel.hashpassword(password)
    })
    res.send(user);
})
app.listen(3000,()=>{
    console.log("server is running on the port 3000");
})
// app.use("/projects", projectroutes);
// app.use("/users", userrouter);
// app.use("/ai", airoutes);
export default app;