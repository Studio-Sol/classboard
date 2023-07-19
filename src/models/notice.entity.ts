import { ObjectId, Schema, model } from "mongoose";
interface Notice {
    title: string;
    content: string;
    preview: string;
    author: ObjectId;
    class: ObjectId;
    timestamp: number;
    questions?: {
        qtype: string;
        content: string;
        items?: {
            content: string;
            limit: number | null;
        }[];
    }[];
}
const noticeSchema = new Schema<Notice>({
    title: String,
    content: String,
    preview: String,
    author: Schema.Types.ObjectId,
    class: Schema.Types.ObjectId,
    timestamp: Number,
    questions: [
        {
            qtype: String,
            content: String,
            items: [
                {
                    content: String,
                    limit: Number,
                },
            ],
        },
    ],
});
export default model("Notice", noticeSchema);
