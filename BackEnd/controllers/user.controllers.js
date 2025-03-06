import { validationResult } from "express-validator";
import * as userservice from "../services/user.services.js";


export const createusercontroller = async (req, res) => {

    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    else {
        try {
            console.log(req.body);
            const user = await userservice.createuser(req.body);
            const token = user.generateJWT();
            delete user._doc.password;

            res.cookie("token", token, { httpOnly: false });

            res.status(201).json({ user, token });
             
        }
        catch (err) {
            res.status(400).send(err.message);
        }
    }
}


export const logincontroller = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    else {
        const response = await userservice.loginuser(req.body);
        // console.log(response);

        if (response.status === "error") {
            res.status(401).send(response.message);
        }
        else {
            const token = response.generateJWT();
            res.cookie("token",token);
            delete response._doc.password;
            res.status(200).json({ response, token });
        }
    }
}