import { Schema, model } from "mongoose";
interface Timetable {
    ATPT_OFCDC_SC_CODE: string;
    SD_SCHUL_CODE: string;
    ALL_TI_YMD: string;
    CLASS_NM: string;
    GRADE: string;
    ITRT_CNTNT: string;
    PERIO: string;
}
const timetableSchema = new Schema<Timetable>({
    ATPT_OFCDC_SC_CODE: String,
    SD_SCHUL_CODE: String,
    ALL_TI_YMD: String,
    CLASS_NM: String,
    GRADE: String,
    ITRT_CNTNT: String,
    PERIO: String,
});
export default model("Timetable", timetableSchema);
