import { Schema, model } from "mongoose";
interface AllNoticeNoAgain {
    user: string;
    notice: string;
}
const allNoticeNoagainSchema = new Schema<AllNoticeNoAgain>({
    user: String,
    notice: String,
});

export default model("allNoticeNoagain", allNoticeNoagainSchema);
