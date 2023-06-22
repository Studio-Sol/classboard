import { ObjectId, Schema, model } from "mongoose";
interface Class {
    school: {
        SD_SCHUL_CODE: string;
        ATPT_OFCDC_SC_CODE: string;
        SCHUL_NM: string;
    };
    class: {
        MADE: ObjectId;
        GRADE: string;
        CLASS_NM: string;
    };
    ay: string;
    invite: string;
}
const classSchema = new Schema<Class>({
    school: {
        SD_SCHUL_CODE: String,
        ATPT_OFCDC_SC_CODE: String,
        SCHUL_NM: String,
    },
    class: {
        MADE: Schema.Types.ObjectId,
        GRADE: String,
        CLASS_NM: String,
    },
    ay: String,
    invite: String,
});

export default model("Class", classSchema);
