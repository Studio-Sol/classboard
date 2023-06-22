import { Schema, model } from "mongoose";
interface Session {
    expires: Date;
    session: string;
}
const sessionSchema = new Schema<Session>({
    expires: Date,
    session: String,
});
export default model("Session", sessionSchema);
