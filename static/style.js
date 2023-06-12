let switchTheme;
switchTheme = () => {
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
};
switchTheme();
window.onfocus = switchTheme;
