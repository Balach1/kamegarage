import "dotenv/config";
import type { ExpoConfig } from "expo/config";

type AppEnv = "development" | "staging" | "prod";
const APP_ENV = (process.env.APP_ENV as AppEnv) ?? "development";

const env = {
  development: {
    name: "Kame Garage (Dev)",
    slug: "kame-garage-dev",
    iosBundleId: "com.kamegarage.dev",
    androidPackage: "com.kamegarage.dev",
  },
  staging: {
    name: "Kame Garage (Staging)",
    slug: "kame-garage-staging",
    iosBundleId: "com.kamegarage.staging",
    androidPackage: "com.kamegarage.staging",
  },
  prod: {
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
      // later: API_URL: process.env.API_URL
    },
  };
};
