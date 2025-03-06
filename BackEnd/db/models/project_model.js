import mongoose, { Schema } from "mongoose";
const  projectSchema = new mongoose.Schema({
    name : {
        type : String ,
        lowercase : true, 
        required : true,
        unique : true,
        trim : true,
    },
    users  : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    }],
    description : {
        type : String ,
        lowercase : true,
        required : true,
        trim : true,
    }
})
export default mongoose.model("project",projectSchema);   