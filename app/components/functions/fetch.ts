export type methodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface initType extends RequestInit {
  body?: any;
  data?: any;
  method?: methodType;
  headers?: ContentTypeHeader;
  timeout?: number;
  cors?: boolean;
  isPlane?: boolean;
}
export async function customFetch(input: string | URL | globalThis.Request, { cors, timeout, method, body, data, headers = {}, isPlane, ...init }: initType = {}) {
  body = body || data;
  if (cors) {
    init.mode = "cors";
    init.credentials = "include";
  }
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
      console.error(response.text);
      return response;
    }
    return response;
  } finally {
    if (typeof timeoutTimer !== "undefined") clearTimeout(timeoutTimer);
  }
}
