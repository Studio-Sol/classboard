import { ObjectId, Schema, model } from "mongoose";
interface User {
    type: string;
    auth: string;
    email: string;
    name: string;
    avatar: string;
    class: ObjectId | null;
    signup_at: number;
}
const userSchema = new Schema<User>({
    type: String,
    auth: String,
    email: String,
    name: String,
    avatar: String,
    class: Schema.Types.ObjectId,
    signup_at: Number,
});

export default model("User", userSchema);
