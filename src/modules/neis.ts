import axios, { AxiosInstance } from "axios";
interface ISchoolInfoRequest {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 학교명
     */
    SCHUL_NM?: string;
    /**
     * 학교종류명
     */
    SCHUL_KND_SC_NM?: string;
    /**
     * 소재지명
     */
    LCTN_SC_NM?: string;
    /**
     * 설립명
     */
    FOND_SC_NM?: string;
}

interface IMealInfoRequest {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 식사코드
     */
    MMEAL_SC_CODE?: string;
    /**
     * 급식일자
     */
    MLSV_YMD?: string;
    /**
     * 급식시작일자
     */
    MLSV_FROM_YMD?: string;
    /**
     * 급식종료일자
     */
    MLSV_TO_YMD?: string;
}

interface IClassInfoRequest {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 학년도
     */
    AY?: string;
    /**
     * 학년
     */
    GRADE?: string;
    /**
     * 주야과정명
     */
    DGHT_CRSE_SC_NM?: string;
    /**
     * 학교과정명
     */
    SCHUL_CRSE_SC_NM?: string;
    /**
     * 계열명
     */
    ORD_SC_NM?: string;
    /**
     * 학과명
     */
    DDDEP_NM?: string;
}

interface ITimetableRequest {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 학년도
     */
    AY?: string;
    /**
     * 학기
     */
    SEM?: string;
    /**
     * 시간표일자
     */
    ALL_TI_YMD?: string;
    /**
     * 주야과정명
     */
    DGHT_CRSE_SC_NM?: string;
    /**
     * 학년
     */
    GRADE?: string;
    /**
     * 반명
     */
    CLASS_NM?: string;
    /**
     * 교시
     */
    PERIO?: string;
    /**
     * 시간표시작일자
     */
    TI_FROM_YMD?: string;
    /**
     * 시간표종료일자
     */
    TI_TO_YMD?: string;
}

interface IResponseHead {
    head: [
        { list_total_count: number },
        { RESULT: { CODE: string; MESSAGE: string } }
    ];
}

interface ISchoolInfoRow {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 시도교육청명
     */
    ATPT_OFCDC_SC_NM?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 학교명
     */
    SCHUL_NM?: string;
    /**
     * 영문학교명
     */
    ENG_SCHUL_NM?: string;
    /**
     * 학교종류명
     */
    SCHUL_KND_SC_NM: string;
    /**
     * 소재지명
     */
    LCTN_SC_NM?: string;
    /**
     * 관할조직명
     */
    JU_ORG_NM?: string;
    /**
     * 설립명
     */
    FOND_SC_NM?: string;
    /**
     * 도로명우편번호
     */
    ORG_RDNZC?: string;
    /**
     * 도로명주소
     */
    ORG_RDNMA?: string;
    /**
     * 도로명상세주소
     */
    ORG_RDNDA?: string;
    /**
     * 전화번호
     */
    ORG_TELNO?: string;
    /**
     * 홈페이지주소
     */
    HMPG_ADRES?: string;
    /**
     * 남녀공학구분명
     */
    COEDU_SC_NM?: string;
    /**
     * 팩스번호
     */
    ORG_FAXNO?: string;
    /**
     * 고등학교구분명
     */
    HS_SC_NM?: string;
    /**
     * 산업체특별학급존재여부
     */
    INDST_SPECL_CCCCL_EXST_YN?: string;
    /**
     * 고등학교일반실업구분명
     */
    HS_GNRL_BUSNS_SC_NM?: string;
    /**
     * 특수목적고등학교계열명
     */
    SPCLY_PURPS_HS_ORD_NM?: string;
    /**
     * 입시전후기구분명
     */
    ENE_BFE_SEHF_SC_NM?: string;
    /**
     * 주야구분명
     */
    DGHT_SC_NM?: string;
    /**
     * 설립일자
     */
    FOND_YMD?: string;
    /**
     * 개교기념일
     */
    FOAS_MEMRD?: string;
    /**
     * 적재일시
     */
    LOAD_DTM?: string;
}

interface ISchoolInfoResponse {
    [0]: IResponseHead;
    [1]: { row: Array<ISchoolInfoRow> };
}

interface IMealInfoRow {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 시도교육청명
     */
    ATPT_OFCDC_SC_NM?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 학교명
     */
    SCHUL_NM?: string;
    /**
     * 식사코드
     */
    MMEAL_SC_CODE?: string;
    /**
     * 식사명
     */
    MMEAL_SC_NM?: string;
    /**
     * 급식일자
     */
    MLSV_YMD?: string;
    /**
     * 급식인원수
     */
    MLSV_FGR?: string;
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
    /**
     * 급식시작일자
     */
    MLSV_FROM_YMD?: string;
    /**
     * 급식종료일자
     */
    MLSV_TO_YMD?: string;
}

interface IMealInfoResponse {
    [0]: IResponseHead;
    [1]: { row: Array<IMealInfoRow> };
}

interface IClassInfoRow {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 시도교육청명
     */
    ATPT_OFCDC_SC_NM?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 학교명
     */
    SCHUL_NM?: string;
    /**
     * 학년도
     */
    AY?: string;
    /**
     * 학년
     */
    GRADE?: string;
    /**
     * 주야과정명
     */
    DGHT_CRSE_SC_NM?: string;
    /**
     * 학교과정명
     */
    SCHUL_CRSE_SC_NM?: string;
    /**
     * 계열명
     */
    ORD_SC_NM?: string;
    /**
     * 학과명
     */
    DDDEP_NM?: string;
    /**
     * 반명
     */
    CLASS_NM?: string;
    /**
     * 적재일시
     */
    LOAD_DTM?: string;
}

interface IClassInfoResponse {
    [0]: IResponseHead;
    [1]: { row: Array<IClassInfoRow> };
}

interface ITimetableRow {
    /**
     * 시도교육청코드
     */
    ATPT_OFCDC_SC_CODE?: string;
    /**
     * 시도교육청명
     */
    ATPT_OFCDC_SC_NM?: string;
    /**
     * 표준학교코드
     */
    SD_SCHUL_CODE?: string;
    /**
     * 학교명
     */
    SCHUL_NM?: string;
    /**
     * 학년도
     */
    AY?: string;
    /**
     * 학기
     */
    SEM?: string;
    /**
     * 시간표일자
     */
    ALL_TI_YMD?: string;
    /**
     * 주야과정명
     */
    DGHT_CRSE_SC_NM?: string;
    /**
     * 학년
     */
    GRADE?: string;
    /**
     * 반명
     */
    CLASS_NM?: string;
    /**
     * 교시
     */
    PERIO?: string;
    /**
     * 수업내용
     */
    ITRT_CNTNT?: string;
    /**
     * 적재일시
     */
    LOAD_DTM?: string;
}
interface IConfig {
    /**
     * 페이지 위치
     */
    pIndex?: number;
    /**
     * 페이지 당 신청 숫자
     */
    pSize?: number;
}
interface ITimeTableResponse {
    [0]: IResponseHead;
    [1]: { row: Array<ITimetableRow> };
}

export default class Neis {
    public key: string;
    public api: AxiosInstance;
    constructor(KEY: string) {
        this.key = KEY;
        this.api = axios.default.create({
            baseURL: "https://open.neis.go.kr/hub",
            params: { KEY: "json" },
        });
    }
    async getSchoolInfo(
        args: ISchoolInfoRequest,
        config?: IConfig
    ): Promise<ISchoolInfoRow[]> {
        if (Object.keys(args).length <= 0)
            throw new Error("최소 1개 이상의 신청인자가 필요합니다.");

        const { data } = await this.api.get("/schoolInfo", {
            params: { ...config, ...args },
        });
        const schoolInfo: ISchoolInfoResponse = data.schoolInfo;

        if (schoolInfo) {
            return schoolInfo[1].row;
        } else {
            throw new Error(data.RESULT.CODE + " " + data.RESULT.MESSAGE);
        }
    }
    async getMealInfo(
        args: IMealInfoRequest,
        config?: IConfig
    ): Promise<IMealInfoRow[]> {
        if (!args.ATPT_OFCDC_SC_CODE || !args.SD_SCHUL_CODE)
            throw new Error(
                "시도교육청코드, 표준학교코드 인자 값이 필요합니다."
            );

        const { data } = await this.api.get("/mealServiceDietInfo", {
            params: { ...config, ...args },
        });
        const mealInfo: IMealInfoResponse = data.mealServiceDietInfo;

        if (mealInfo) {
            return mealInfo[1].row;
        } else {
            throw new Error(data.RESULT.CODE + " " + data.RESULT.MESSAGE);
        }
    }
    async getClassInfo(
        args: IClassInfoRequest,
        config?: IConfig
    ): Promise<IClassInfoRow[]> {
        if (!args.ATPT_OFCDC_SC_CODE || !args.SD_SCHUL_CODE)
            throw new Error(
                "시도교육청코드, 표준학교코드 인자 값이 필요합니다."
            );

        const { data } = await this.api.get("/classInfo", {
            params: { ...config, ...args },
        });
        const classInfo: IClassInfoResponse = data.classInfo;

        if (classInfo) {
            return classInfo[1].row;
        } else {
            throw new Error(data.RESULT.CODE + " " + data.RESULT.MESSAGE);
        }
    }
    async getTimetable(
        schoolData: ISchoolInfoRequest,
        args: ITimetableRequest,
        config?: IConfig
    ): Promise<ITimetableRow[]> {
        const schoolInfo = await this.getSchoolInfo(schoolData, config);
        const school = schoolInfo[0];
        if (schoolInfo.length > 1)
            throw new Error(
                "검색된 학교가 많습니다. 자세한 정보를 입력해주세요."
            );

        const schoolType: { [index: string]: string } = {
            ["초등학교"]: "elsTimetable",
            ["중학교"]: "misTimetable",
            ["고등학교"]: "hisTimetable",
            ["특수학교"]: "spsTimetable",
        };
        const { data } = await this.api.get(
            `/${schoolType[school.SCHUL_KND_SC_NM]}`,
            {
                params: {
                    ...config,
                    ...args,
                    ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: school.SD_SCHUL_CODE,
                },
            }
        );
        const timetable: ITimeTableResponse =
            data[schoolType[school.SCHUL_KND_SC_NM]];

        if (timetable) {
            return timetable[1].row;
        } else {
            throw new Error(data.RESULT.CODE + " " + data.RESULT.MESSAGE);
        }
    }
}
