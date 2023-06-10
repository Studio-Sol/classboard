function switchTheme() {
    if (localStorage.getItem("theme") == "dark") {
        document.documentElement.style.setProperty("--bg", "#181818");
        document.documentElement.style.setProperty("--box-bg", "#252525");
        document.documentElement.style.setProperty("--text", "#ffffff");
        document.documentElement.style.setProperty(
            "--hover",
            "rgba(255, 255, 255, 0.1)"
        );
        document.documentElement.style.setProperty("--link", "#57acdc");
    }
    if (localStorage.getItem("theme") == "light") {
        document.documentElement.style.setProperty("--bg", "#f3f5f7");
        document.documentElement.style.setProperty("--box-bg", "#ffffff");
        document.documentElement.style.setProperty("--text", "#202124");
        document.documentElement.style.setProperty(
            "--hover",
            "rgba(0, 0, 0, 0.1)"
        );
        document.documentElement.style.setProperty("--link", "#4e5cde");
    }
}

switchTheme();
window.onfocus = switchTheme;
