import { ObjectId, Schema, model } from "mongoose";
interface Reply {
    user:ObjectId;
    id:string
    answer: string
    timestamp: number
}
const replySchema = new Schema<Reply>({
    user:Schema.Types.ObjectId,
    id:String,
    answer: String,
    timestamp: Number,
});
export default model("Reply", replySchema);
