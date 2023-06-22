import { ObjectId, Schema, model } from "mongoose";
interface Notice {
    title: string;
    content: string;
    preview: string;
    author: ObjectId;
    class: ObjectId;
    timestamp: number;
    question?: {
        type:string;
        content: string;
        items?:{
            content:string;
            limit:number|null;
        }
    };
}
const noticeSchema = new Schema<Notice>({
    title: String,
    content: String,
    preview: String,
    author: Schema.Types.ObjectId,
    class: Schema.Types.ObjectId,
    timestamp: Number,
    question: {
        type:String,
        content: String,
        items:{
            content:String,
            limit:[Number,null],
        }
    }
});
export default model("Notice", noticeSchema);
