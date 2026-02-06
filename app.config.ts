import "dotenv/config";
import type { ExpoConfig } from "expo/config";

type AppEnv = "development" | "staging" | "production" | "prod";

// normalize aliases
const rawEnv = (process.env.APP_ENV ?? "development") as AppEnv;
const APP_ENV: "development" | "staging" | "production" =
  rawEnv === "prod" ? "production" : rawEnv;

const env = {
  development: {
    name: "Kame Garage (Dev)",
    slug: "kame-garage",
    iosBundleId: "com.kamegarage.dev",
    androidPackage: "com.kamegarage.dev",
  },
  staging: {
    name: "Kame Garage (Staging)",
    slug: "kame-garage-staging",
    iosBundleId: "com.kamegarage.staging",
    androidPackage: "com.kamegarage.staging",
  },
  production: {
    name: "Kame Garage",
    slug: "kame-garage",
    iosBundleId: "com.kamegarage",
    androidPackage: "com.kamegarage",
  },
} as const;

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const e = env[APP_ENV];

  return {
    ...config,
    name: e.name,
    slug: e.slug,

    ios: {
      ...config.ios,
      bundleIdentifier: e.iosBundleId,
    },

    android: {
      ...config.android,
      package: e.androidPackage,
    },

    extra: {
      ...config.extra,
      APP_ENV,
    },
  };
};
