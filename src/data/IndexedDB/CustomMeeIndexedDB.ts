import { AutoImageItemType, getImageAlbumMap } from "@/functions/media/imageFunction";
import { MeeIndexedDBTable } from "./MeeIndexedDB";
import { ArrayEnv } from "@/Env";

export class ImageMeeIndexedDBTable extends MeeIndexedDBTable<ImageType> {
  imageAlbums: Map<string, ImageAlbumType>;
  constructor(props: Props_MeeIndexedDBTable_Constructor<ImageType>) {
    super(props);
    this.imageAlbums = getImageAlbumMap(ArrayEnv.IMAGE_ALBUMS);
  }
  override async clone() {
    return new ImageMeeIndexedDBTable({ ...this.props, db: this.db });
  }
  async getAlbums() {
    return this.find({ index: "album", direction: "nextunique" }).then(
      (images) => images.filter(image => image.album).map((image) => image.album!)
    );
  }
  async updateData({ lastmod, latest }: { lastmod?: Date, latest?: Date }) {
    return await this.usingStore({
      mode: "readwrite", callback: async (store) => {
        let lastmodQuery: IDBKeyRange | undefined;
        if (lastmod) lastmodQuery = IDBKeyRange.lowerBound(lastmod, true);
        await this.getAll({ index: "lastmod", query: lastmodQuery, store })
          .then(async (images) => {
            images.forEach(image => {
              if (lastmod) image.update = Boolean(image.lastmod!.getTime() > lastmod.getTime())
              image.new =
                image.update &&
                (image.time && latest
                  ? image.time > latest
                  : false);

              const album = image.album ? this.imageAlbums.get(image.album) : null;
              image.type = image.type ? image.type : AutoImageItemType(image.embed, album?.type);
              return image;
            });
            return Promise.all(images.map(image =>
              this.put({ value: image, store })
            ))
          })
      }
    })
  }
}
