import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { HonoRequest } from "hono";

export interface GetDataProps {
  searchParams: URLSearchParams,
  db: MeeSqlD1,
  isLogin?: boolean,
  req: HonoRequest<string>
}