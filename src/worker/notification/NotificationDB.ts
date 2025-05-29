import { IndexedKVClass } from "@src/data/IndexedDB/MeeIndexedDataClass";
import { MeeIndexedDB } from "@src/data/IndexedDB/MeeIndexedDB";

const NOTIFICATION_DB_NAME = "cottonwind-worker";
const NOTIFICATION_TABLE_NAME = "notification";
const NOTIFICATION_INDEXEDDB_VERSION: number = 1;

export class IndexedNotification_KV extends IndexedKVClass<boolean | null, string> { }
export const indexedNotification = new IndexedNotification_KV({ name: NOTIFICATION_TABLE_NAME });

export var dbNotificationClass: MeeIndexedDB | undefined;
export const dbNotificationCreatePromise = MeeIndexedDB.create({
  dbName: NOTIFICATION_DB_NAME,
  version: NOTIFICATION_INDEXEDDB_VERSION,
  async onupgradeneeded(e, db) {
    await indexedNotification.dbUpgradeneeded(e, db);
  },
  async onsuccess(db) {
    await indexedNotification.dbSuccess(db);
  },
}).then((db) => {
  dbNotificationClass = db;
  return db;
});
