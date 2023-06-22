import { ObjectId, Schema, model } from "mongoose";
interface Calander {
    user: ObjectId;
    class: ObjectId;
    start: Date;
    end: Date;
    title: string;
    description: string;
}
const calanderSchema = new Schema<Calander>({
    user: Schema.Types.ObjectId,
    class: Schema.Types.ObjectId,
    start: Date,
    end: Date,
    title: String,
    description: String,
});

export default model("Calander", calanderSchema);
