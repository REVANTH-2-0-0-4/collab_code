
import dotenv from "dotenv";
dotenv.config();
// console.log(process.env.MONGODB_URI);
import mongoose from 'mongoose';
async function connect() {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log("Connected to MongoDB successfully");
        })
        .catch((err) => {
            console.error("Error connecting to MongoDB:", err);
        });
}
export default connect;