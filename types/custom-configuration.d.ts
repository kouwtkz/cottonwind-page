import type { MeeSqlClass } from "~/data/functions/MeeSqlClass";

export type CfBindingTypes = { DB: D1Database, BUCKET: R2Bucket, KV: KVNamespace, NOTICE_FEED_KV: KVNamespace };
export type OmittedEnv = Omit<Env & CfBindingTypes, "DB" | "BUCKET" | "KV" | "NOTICE_FEED_KV">;

declare global {
  var meeGlobalDB: MeeSqlClass | null | undefined;
  var globalEnv: OmittedEnv | undefined;
}
