export const buildTimeEnv = import.meta.env.VITE_BUILD_TIME;
export const buildTime = buildTimeEnv ? new Date(buildTimeEnv) : null;
export const buildTimeNum = buildTime ? Math.ceil(buildTime.getTime() / 1000) : 0;
export const buildAddVer = import.meta.env.PROD ? "?v=" + buildTimeNum : "";

export const stylesTimeEnv = import.meta.env.VITE_STYLES_TIME;
export const stylesTime = stylesTimeEnv ? new Date(stylesTimeEnv) : null;
export const stylesTimeNum = stylesTime ? Math.ceil(stylesTime.getTime() / 1000) : 0;
export const stylesAddVer = import.meta.env.PROD ? "?v=" + stylesTimeNum : "";
