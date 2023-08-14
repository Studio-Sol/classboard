// THEME
function switchTheme() {
    stylesheet = document.documentElement.style;
    function getCSSValue(v) {
        return getComputedStyle(document.documentElement).getPropertyValue(v);
    }
    styles = {
        dark: {
            bg: getCSSValue("--dark-bg"),
            box_bg: getCSSValue("--dark-box-bg"),
            text: getCSSValue("--dark-text"),
            hover: getCSSValue("--dark-hover"),
            link: getCSSValue("--dark-link"),
        },
        light: {
            bg: getCSSValue("--light-bg"),
            box_bg: getCSSValue("--light-box-bg"),
            text: getCSSValue("--light-text"),
            hover: getCSSValue("--light-hover"),
            link: getCSSValue("--light-link"),
        },
    };
    if (!localStorage.getItem("theme"))
        if (window.matchMedia("(prefers-color-scheme: light)").matches) {
            localStorage.setItem("theme", "light");
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            localStorage.setItem("theme", "dark");
        }
    if (localStorage.getItem("theme") == "dark") {
        stylesheet.setProperty("--bg", styles.dark.bg);
        stylesheet.setProperty("--box-bg", styles.dark.box_bg);
        stylesheet.setProperty("--text", styles.dark.text);
        stylesheet.setProperty("--hover", styles.dark.hover);
        stylesheet.setProperty("--link", styles.dark.link);
    } else if (localStorage.getItem("theme") == "light") {
        stylesheet.setProperty("--bg", styles.light.bg);
        stylesheet.setProperty("--box-bg", styles.light.box_bg);
        stylesheet.setProperty("--text", styles.light.text);
        stylesheet.setProperty("--hover", styles.light.hover);
        stylesheet.setProperty("--link", styles.light.link);
    }
}
switchTheme();
window.onfocus = switchTheme;
window.addEventListener("load", () => {
    function handleNetworkChange() {
        if (navigator.onLine) {
            console.log("online");
            localStorage.setItem("showOfflineMessage", "true");
        } else {
            console.log("offline");
            if (localStorage.getItem("showOfflineMessage") == "true") {
                let offlineMessageBox = document.createElement("div");
                offlineMessageBox.style.position = "fixed";
                offlineMessageBox.style.top = "0px";
                offlineMessageBox.style.width = "100vw";
                offlineMessageBox.style.justifyContent = "space-between";
                offlineMessageBox.style.display = "flex";
                offlineMessageBox.style.background = "var(--bs-danger)";
                offlineMessageBox.style.alignItems = "center";
                offlineMessageBox.style.zIndex = "10000000000";
                offlineMessageBox.id = "offlineMessageBox";

                offlineMessageBox.innerHTML = `<h1>오프라인 모드입니다</h1><i onclick="document.getElementById('offlineMessageBox').remove();localStorage.setItem('showOfflineMessage','false')" style="font-size: 2rem" class="pe-3 fa fa-close"></i>`;
                document.body.append(offlineMessageBox);
            }
        }
    }
    setInterval(handleNetworkChange, 1000);
});
