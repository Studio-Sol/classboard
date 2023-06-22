import { ObjectId, Schema, model } from "mongoose";
interface AllNotice {
    icon: string;
    title: string;
    html: string;
    footer: string;
}
const allNoticeSchema = new Schema<AllNotice>({
    icon: String,
    title: String,
    html: String,
    footer: String,
});

export default model("AllNotice", allNoticeSchema);
