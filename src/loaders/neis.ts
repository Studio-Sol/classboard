import Neis from "../modules/neis.js";

export default () => {
    const neis = new Neis(process.env.NEIS_API_KEY);
    return neis;
};
