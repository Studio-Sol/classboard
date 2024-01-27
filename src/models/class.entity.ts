import { ObjectId, Schema, model } from "mongoose";
interface Class {
    SD_SCHUL_CODE: string;
    ATPT_OFCDC_SC_CODE: string;
    SCHUL_NM: string;
    MADE: ObjectId;
    GRADE: string;
    CLASS_NM: string;
    invite: string;
}
const classSchema = new Schema<Class>({
    SD_SCHUL_CODE: String,
    ATPT_OFCDC_SC_CODE: String,
    SCHUL_NM: String,
    MADE: Schema.Types.ObjectId,
    GRADE: String,
    CLASS_NM: String,
    invite: String,
});

export default model("Class", classSchema);
