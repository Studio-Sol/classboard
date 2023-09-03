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

                offlineMessageBox.innerHTML = `<h1>오프라인 모드입니다</h1><svg onclick="document.getElementById('offlineMessageBox').remove();localStorage.setItem('showOfflineMessage','false')" style="font-size: 2rem" class="pe-3" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
                document.body.append(offlineMessageBox);
            }
        }
    }
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
});
