import { Context, Env, Hono } from "hono"
import { BlankSchema } from "hono/types";
type CommonHono = Hono<MeeBindings, BlankSchema, "/">;
type CommonContext = Context<MeeBindings, string, any>;

interface CommonContextProps {
  c: CommonContext
}
