import Neis from "@my-school.info/neis-api";

export default () => {
    const neis = new Neis({
        KEY: process.env.NEIS_API_KEY,
        Type: "json",
    });
    return neis;
};
