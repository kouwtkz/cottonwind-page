export type methodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface initType extends RequestInit {
  body?: any;
  data?: any;
  method?: methodType;
  headers?: ContentTypeHeader;
  timeout?: number;
  cors?: boolean;
  isPlane?: boolean;
  putLog?: boolean;
}
export async function customFetch(input: string | URL | globalThis.Request, { cors, timeout, method, body, data, headers = {}, isPlane, putLog, ...init }: initType = {}) {
  body = body || data;
  if (cors) init.mode = "cors";
  const isFormData = body && (body instanceof FormData);
  if (body && !isPlane && !isFormData) {
    headers["Content-Type"] = "application/json";
    if (typeof body !== "string") body = JSON.stringify(body);
  }
  let timeoutTimer: NodeJS.Timeout | undefined;
  try {
    if (timeout) {
      const controller = new AbortController();
      timeoutTimer = setTimeout(() => { controller.abort() }, timeout || 15000)
    }
    const response = await fetch(input, { method, body, headers, ...init });
    if (!response.ok) {
      if (putLog) console.error(await response.json());
      throw response;
    } else return response;
  } finally {
    if (typeof timeoutTimer !== "undefined") clearTimeout(timeoutTimer);
  }
}
