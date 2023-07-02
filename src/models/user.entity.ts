import { ObjectId, Schema, model } from "mongoose";
interface User {
    type: string;
    auth: string;
    email: string;
    name: string;
    avatar: string;
    class: ObjectId | null;
    waiting: boolean;
    signup_at: number;
}
const userSchema = new Schema<User>({
    type: String,
    auth: String,
    email: String,
    name: String,
    avatar: String,
    class: Schema.Types.ObjectId,
    waiting: Boolean,
    signup_at: Number,
});

export default model("User", userSchema);
