const siteLocales = require("./config/locales")

module.exports = {
    reactStrictMode: true,
    experimental: {
        esmExternals: "loose",
    },
    transpilePackages: [
        "@contentful/optimization-api-client",
        "@contentful/optimization-api-schemas",
        "@contentful/optimization-core",
        "@contentful/optimization-nextjs",
        "@contentful/optimization-node",
        "@contentful/optimization-react-web",
        "@contentful/optimization-web",
        "zod",
    ],
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
