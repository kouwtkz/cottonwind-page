import { MeeIndexedDB } from "./MeeIndexedDB";
import { importfromStorageData } from "./ConvertToMeeIndexedData";
import { ImageDataOptions, INDEXEDDB_NAME, INDEXEDDB_VERSION } from "../DataEnv";
import { ImageMeeIndexedDBTable } from "./CustomMeeIndexedDB";
import { ImageIndexedDataStateClass } from "./CustomIndexedDataStateClass";

export const imageDataIndexed = new ImageIndexedDataStateClass(
  ImageDataOptions,
  new ImageMeeIndexedDBTable({ options: ImageDataOptions })
);
const table = imageDataIndexed.table;
const dbClass = await MeeIndexedDB.create(
  {
    version: INDEXEDDB_VERSION,
    dbName: INDEXEDDB_NAME,
    onupgradeneeded(e, db) {
      table.dbUpgradeneeded(db);
    },
    async onsuccess(db) {
      await imageDataIndexed.dbSuccess(db);
    }
  }
);

// importfromStorageData({ table, convert: ImageDataOptions.convert });
// await imageDataIndexed.updateData();
// await table.clear();
console.log(imageDataIndexed);

// console.log(
//   await table.find({ where: { copyright: { has: true } } })
// );
// console.log(await table.find({ index: "lastmod", direction: "prev", take: 1 }).then(v => v[0]?.lastmod));
// console.log(await table.find({ index: "album", direction: "nextunique" }).then(images => images.map((image) => image.album)));

dbClass.close();
