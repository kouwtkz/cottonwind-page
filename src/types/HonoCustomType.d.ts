import { Context, Env, Hono } from "hono"
import { BlankSchema } from "hono/types";
type CommonHono<T = MeeCommonEnv> = Hono<MeeBindings<T>, BlankSchema, "/">;
type CommonContext<T = MeeCommonEnv> = Context<MeeBindings<T>, string, any>;

interface CommonContextProps {
  c: CommonContext
}
