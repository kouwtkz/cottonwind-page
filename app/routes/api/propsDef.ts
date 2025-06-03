import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";

export interface GetDataProps {
  searchParams: URLSearchParams,
  db: MeeSqlD1,
  isLogin?: boolean,
  request: Request
}