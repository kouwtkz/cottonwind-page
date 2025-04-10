import { ImageMeeIndexedDBTable } from "./CustomMeeIndexedDB";
import { IndexedDataStateClass } from "./IndexedDataStateClass";

export class ImageIndexedDataStateClass extends IndexedDataStateClass<ImageType, ImageDataType, ImageMeeIndexedDBTable> {
  override async updateData() {
    return this.table.updateData({ lastmod: this.beforeLastmod, latest: this.latest });
  }
  override async dbSuccess(db: IDBDatabase) {
    await super.dbSuccess(db)
    await this.updateData();
  }
}