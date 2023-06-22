import { ObjectId, Schema, model } from "mongoose";
interface Post {
    title: string;
    content: string;
    preview: string;
    author: string;
    class: string;
    timestamp: number;
}
const postSchema = new Schema<Post>({
    title: String,
    content: String,
    preview: String,
    author: String,
    class: String,
    timestamp: Number,
});
export default model("Post", postSchema);
