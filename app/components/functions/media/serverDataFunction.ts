import { ImageTableObject } from "~/routes/api/image";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";

export async function ImageSelectFromKey(db: MeeSqlD1, key: string) {
  return (await ImageTableObject.Select({ db, where: { key }, take: 1 }))[0]
}
