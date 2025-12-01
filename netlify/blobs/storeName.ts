type EnvGetter = (key: string) => string | undefined;

interface GlobalEnv {
  Netlify?: {
    env?: {
      get?: EnvGetter;
    };
  };
  Deno?: {
    env?: {
      get?: EnvGetter;
    };
  };
  process?: {
    env?: Record<string, string | undefined>;
  };
}

const globalEnv = globalThis as GlobalEnv;

const getFromEnv = (getter?: EnvGetter): string | undefined => {
  if (!getter) return undefined;
  return getter("CONTEXT") ?? getter("NETLIFY_CONTEXT");
};

/**
 * Resolves the Netlify Blobs store name based on the current deploy context.
 * Production uses the base name, while all other contexts use a dev-prefixed store.
 */
export const resolveBlobStoreName = (
  baseName: string,
  contextHint?: string | null,
): string => {
  const envContext =
    contextHint ??
    getFromEnv(globalEnv.Netlify?.env?.get) ??
    getFromEnv(globalEnv.Deno?.env?.get) ??
    globalEnv.process?.env?.NETLIFY_CONTEXT ??
    globalEnv.process?.env?.CONTEXT ??
    globalEnv.process?.env?.NODE_ENV;

  const isProduction =
    envContext === "production" ||
    envContext === "prod" ||
    envContext === "main";

  return isProduction ? baseName : `dev-${baseName}`;
};
