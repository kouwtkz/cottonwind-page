import { HonoRequest } from "hono";

export function getIpAddress(req: HonoRequest<string>) {
  return req.header('cf-connecting-ip') || req.header('x-forwarded-for') || "anonymous";
}