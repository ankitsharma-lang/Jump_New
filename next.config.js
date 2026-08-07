const siteLocales = require("./config/locales")

module.exports = {
    reactStrictMode: true,
    i18n: {
        locales: siteLocales.locales,
        defaultLocale: siteLocales.defaultLocale,
        localeDetection: false,
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "images.ctfassets.net" },
            { protocol: "https", hostname: "images.eu.ctfassets.net" },
        ],
    },
};
