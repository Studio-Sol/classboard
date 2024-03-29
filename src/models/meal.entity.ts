import { ObjectId } from "bson";
import {
    Schema,
    StringExpressionOperatorReturningBoolean,
    model,
} from "mongoose";
interface Meal {
    /**
     * 캐시 관리를 위한 date
     */
    date: Date;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 급식일자
     */
    MLSV_YMD?: string;
    /**
     * 식사명
     */
    MMEAL_SC_NM?: string;
    /**
     * 요리명
     */
    DDISH_NM?: string;
    /**
     * 원산지정보
     */
    ORPLC_INFO?: string;
    /**
     * 칼로리정보
     */
    CAL_INFO?: string;
    /**
     * 영양정보
     */
    NTR_INFO?: string;
    favorites: ObjectId[][];
}
const mealSchema = new Schema<Meal>({
    date: Date,
    SD_SCHUL_CODE: String,
    MLSV_YMD: String,
    MMEAL_SC_NM: String,
    DDISH_NM: String,
    ORPLC_INFO: String,
    CAL_INFO: String,
    NTR_INFO: String,
    favorites: Array<Array<ObjectId>>,
});

export default model("Meal", mealSchema);
