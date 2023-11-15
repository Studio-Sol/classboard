import { Schema, model } from "mongoose";
interface AllNotice {
    html: string;
}
const allNoticeSchema = new Schema<AllNotice>({
    html: String,
});

export default model("AllNotice", allNoticeSchema);
