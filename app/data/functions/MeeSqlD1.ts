import { MeeSqlClass } from "./MeeSqlClass";

export class MeeSqlD1 extends MeeSqlClass<D1Database> {
  override async select<K>(args: MeeSqlSelectProps<K>): Promise<K[]> {
    const result = await super.select(args) as unknown as D1Result;
    return result.results as K[];
  }
}
