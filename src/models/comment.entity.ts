import { ObjectId, Schema, model } from "mongoose";
interface Comment {
    author: ObjectId;
    id: string;
    content: string;
    timestamp: number;
    reply: string | null;
}
const commentSchema = new Schema<Comment>({
    author: Schema.Types.ObjectId,
    id: String,
    content: String,
    timestamp: Number,
    reply: [String, null],
});
export default model("Comment", commentSchema);
