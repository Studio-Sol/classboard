import { Schema, model } from "mongoose";
interface AllNotice {
    color: string;
    html: string;
}
const allNoticeSchema = new Schema<AllNotice>({
    color: String,
    html: String,
});

export default model("AllNotice", allNoticeSchema);
