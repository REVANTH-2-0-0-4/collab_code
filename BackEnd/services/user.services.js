import usermodel from "../db/models/user_model.js";

export async function createuser({ firstname , lastname,email, password, confirmpassword }) {
    if (!email || !password || !firstname) {
        throw new Error('All details must be present');
    }
    if(password !== confirmpassword){
        throw new Error('password and confirm password must be same');
    }

    const user = await usermodel.create({
        firstname,
        lastname,
        email,
        password: await usermodel.hashpassword(password)
    })
    return user;
}


export async function loginuser({ email, password }) {
    try {
        const user = await usermodel.findOne({ email: email }).select("+password");
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isMatch = await user.isvalidpassword(password);
        if (!isMatch) {
            throw new Error("Invalid credentials");
        }

        return user; 
    } catch (err) {
        return { status: "error", message: err.message };
    }
}