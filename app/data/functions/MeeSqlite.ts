import BetterSqlite3 from "better-sqlite3";
import { MeeSqlClass } from "./MeeSqlClass";

export class MeeSqlite extends MeeSqlClass<BetterSqlite3.Database> {
  constructor(path: string, options?: BetterSqlite3.Options) {
    super(new BetterSqlite3(path, options));
  }
  dispose() {
    this.db.close();
  }
  override async select<K>(args: MeeSqlSelectProps<K>): Promise<K[]> {
    return await super.select(args) as K[];
  }
  async exists<K>(args: MeeSqlSelectProps<K>) {
    return (await this.select<K>({ ...args, take: 1 })).length > 0
  }
  begin() {
    this.db.exec("BEGIN");
  }
  commit() {
    this.db.exec("COMMIT");
  }
  rollback() {
    this.db.exec("ROLLBACK");
  }
}
