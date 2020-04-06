module.exports = {
    apps: [
    {
        name: "NubisonApiServer",
        script: "bin/www",
        env: {
            NODE_ENV: "development",
        },
        env_test: {
            NODE_ENV: "test",
        },
        env_staging: {
            NODE_ENV: "staging",
        },
        env_production: {
            NODE_ENV: "production",
        },
    },
]};