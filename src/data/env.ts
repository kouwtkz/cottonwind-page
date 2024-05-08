export const buildTime = import.meta.env.VITE_BUILD_TIME ? new Date(import.meta.env.VITE_BUILD_TIME) : null;
export const buildTimeNum = buildTime ? Math.ceil(buildTime.getTime() / 1000) : 0;
export const buildAddVer = import.meta.env.PROD ? "?v=" + buildTimeNum : "";

export const stylesTime = import.meta.env.VITE_BUILD_TIME ? new Date(import.meta.env.VITE_BUILD_TIME) : null;
export const stylesTimeNum = stylesTime ? Math.ceil(stylesTime.getTime() / 1000) : 0;
export const stylesAddVer = import.meta.env.PROD ? "?v=" + stylesTimeNum : "";
