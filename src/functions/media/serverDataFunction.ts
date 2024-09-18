import { MeeSqlD1 } from "../MeeSqlD1";

export async function ImageSelectFromKey(db: MeeSqlD1, key: string) {
  return (
    await db.select<ImageDataType>({
      table: "images",
      where: { key },
      take: 1,
    })
  )[0];
}
