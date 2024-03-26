export const buildTimeEnv = import.meta.env.VITE_BUILD_TIME;
export const buildTime = buildTimeEnv ? new Date(buildTimeEnv) : null;
export const buildTimeNum = buildTime ? Math.ceil(buildTime.getTime() / 1000) : 0;
export const buildAddVer = import.meta.env.PROD ? "?v=" + buildTimeNum : ""