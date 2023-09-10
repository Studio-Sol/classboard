import { Schema, model } from "mongoose";
interface Token {
    token: string;
    payload: string;
    expireAt: Date;
}
const tokenSchema = new Schema<Token>({
    token: String,
    payload: String,
    expireAt: {
        type: Date,
        expires: 0,
    },
});

export default model("Token", tokenSchema);
