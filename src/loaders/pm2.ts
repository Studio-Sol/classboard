import io from "@pm2/io";
export default () => {
    return {
        sessionCounter: io.metric({
            name: "session count",
        }),
    };
};
