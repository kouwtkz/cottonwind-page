import type { MeeSqlClass } from "~/data/functions/MeeSqlClass";

export type CfBindingTypes = { DB: D1Database, BUCKET: R2Bucket };
export type ServerEnv = Partial<Env> & CfBindingTypes;
export type OmittedEnv = Omit<Env & CfBindingTypes, "DB" | "BUCKET">;

declare global {
  var meeGlobalDB: MeeSqlClass | null | undefined;
  var globalEnv: OmittedEnv | undefined;
}
