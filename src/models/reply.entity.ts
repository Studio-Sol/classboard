import { ObjectId, Schema, model } from "mongoose";
interface Reply {
    user: ObjectId;
    id: string;
    answers: [];
    timestamp: number;
}
const replySchema = new Schema<Reply>({
    user: Schema.Types.ObjectId,
    id: String,
    answers: [],
    timestamp: Number,
});
export default model("Reply", replySchema);
