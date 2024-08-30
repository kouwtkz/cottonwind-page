import { Context, Env, Hono } from "hono"
import { BlankSchema } from "hono/types";
type CommonHono = Hono<MeePagesBindings, BlankSchema, "/">;
type CommonContext = Context<MeePagesBindings, string, any>;

interface CommonContextProps {
  c: CommonContext
}
