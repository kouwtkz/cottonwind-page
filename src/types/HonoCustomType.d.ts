import { Context, Env, Hono } from "hono"
import { BlankSchema } from "hono/types";
type CommonHono = Hono<Env, BlankSchema, "/">;
type CommonContext = Context<Env, string, any>;

interface ContextWithToken {
  token: kvTokenType | null;
  c: CommonContext
}