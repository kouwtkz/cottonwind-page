import { load } from "js-yaml";
import fs from "fs";
import { resolve, extname, parse } from "path";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

type _Dirent = { name: string; dir: string; };

export async function GetYamlImageList({ from, to: _to, filter, readImageHandle, retouchImageHandle, deleteImage = false, readSize }: GetYamlImageListProps) {
  from = from.replace(/[\\/]+/g, "/");
  const to = _to === undefined ? from : _to;
  // ディレクトリ内の各ファイルを取得
  let files: fs.Dirent[] = [];
  const _from = resolve(`${cwd}/${from}`);
  try {
    files = fs.readdirSync(_from, { recursive: true, withFileTypes: true })
      .filter(dirent => dirent.isFile())
  } catch (e) {
    console.error(e);
  }
  const ls = files.reduce((a, dirent) => {
    const dirChild = dirent.path.replace(_from, "").replace(/\\/g, "/");
    const v: _Dirent = { name: dirent.name, dir: dirChild }
    const ext = extname(dirent.name);
    if (/^\.(ya?ml)$/i.test(ext))
      a.yamls.push(v);
    else if (/^\.(png|jpe?g|gif|webp|svg)$/i.test(ext))
      a.images.push(v);
    else if (/^\.(epub)$/i.test(ext))
      a.images.push(v);
    return a;
  },
    {
      yamls: [] as _Dirent[],
      images: [] as _Dirent[],
      data: [] as _Dirent[]
    })

  // 次にyamlファイルのリストを作成
  let yamls: YamlGroupType[] = ls.yamls.map((yaml) => {
    const dataStr = String(fs.readFileSync(resolve(`${cwd}/${from}/${yaml.dir}/${yaml.name}`)))
    const data: YamlDataType = dataStr ? load(dataStr) ?? {} : {};
    const list: MediaImageInYamlType[] = [];
    return { data, list, from, to, already: Boolean(dataStr), ...yaml };
  }).filter((y) => y.already).sort((a, b) => a < b ? 1 : -1);
  ls.images.forEach(img => {
    let candidate = yamls.find(yaml => img.dir.startsWith(yaml.dir));
    // 取得した候補に再帰定義がなく、同一フォルダでなければ新規定義
    if (candidate === undefined || (candidate.dir !== img.dir && !candidate.data.recursive)) {
      candidate = { ...img, from, to, name: "_data.yaml", already: false, list: [], data: { recursive: true, listup: false } };
      yamls.unshift(candidate);
    }
    let dir = img.dir.replace(candidate.dir, "");
    if (/\/\.\w+$/i.test(dir)) {
      candidate = { ...img, from, to, dir: img.dir, name: "_data.yaml", already: false, list: [], data: { recursive: true, listup: false } };
      dir = img.dir.replace(dir, "");
      yamls.unshift(candidate);
    }
    if (!candidate.list?.some(c => c.src === img.name)) {
      const stat = fs.statSync(resolve(`${cwd}/${from}/${img.dir}/${img.name}`));
      candidate.list.push({ name: parse(img.name).name, src: img.name, dir, time: stat.mtime });
    }
  })
  // リストの突合処理
  yamls.forEach((y) => {
    y.list = y.list.map((yItem) => {
      const foundIndex = (y.data.list || []).findIndex((ydItem) => ydItem.src === yItem.src);
      const ydItem = (y.data.list && foundIndex >= 0) ? y.data.list[foundIndex] : null;
      const item = ydItem ? { ...yItem, ...ydItem, dir: yItem.dir } : yItem;
      if (y.data.list && foundIndex >= 0) y.data.list[foundIndex] = item;
      return item;
    }
    );
  });
  yamls.forEach((y) => {
    y.list.forEach(item => {
      item.originName = item.src;
      item.origin = from.replace(/^\/*/, '/') + y.dir + item.dir + '/' + item.originName;
    })
  })
  if (filter && Object.keys(filter).length > 0) {
    const filterGroup = filter.group;
    if (filterGroup) yamls = yamls.filter((y) => {
      const ynames = [y.dir]
      if (y.data.name) ynames.push(y.data.name);
      if (typeof filterGroup === "object") {
        if (Array.isArray(filterGroup)) return ynames.some(v =>
          filterGroup.some(group => filter.endsWith ? v.endsWith(group) : v.match(group)))
        else return ynames.some(v => filterGroup.test(v));
      }
      else return ynames.some(v => filter.endsWith ? v.endsWith(filterGroup) : v.match(filterGroup));
    })
    const filterListup = filter.listup;
    if (filterListup !== undefined) yamls = yamls.filter(({ data }) => data?.listup === undefined ? false : data.listup === filterListup);
    const filterArchive = filter.archive;
    if (filterArchive !== undefined) yamls = yamls.filter(({ dir }) => (/\.archive$/.test(dir)) === filterArchive)
    const filterPath = filter.path;
    if (filterPath) yamls.forEach((y) => {
      y.list = y.list.filter(({ origin }) => {
        if (origin) {
          if (typeof filterPath === "object") filterPath.test(origin)
          else {
            if (filter.endsWith) origin.endsWith(filterPath)
            else origin.match(filterPath)
          }
        }
      })
    })
    const filterTags = filter.tags ? (typeof filter.tags === "string" ? [filter.tags] : filter.tags) : [];
    if (filterTags.length > 0) yamls.forEach((y) => {
      y.list = y.list.filter(({ tags }) => tags?.some(tag => filterTags.some(ftag => ftag === tag)))
    })
    if (filter.topImage) yamls.forEach((y) => {
      y.list = y.list.filter(({ topImage }) => topImage)
    })
  }
  // 画像読み取りハンドル
  if (readImageHandle) await readImageHandle({ yamls, readSize, retouchImageHandle, deleteImage });
  yamls = yamls.filter(({ list }) => list.length > 0)
  return yamls;
}

export function GetMediaImageAlbumFromYamls(yamls: YamlGroupType[]): MediaImageAlbumType[] {
  return yamls.map((y) => {
    const { list: ydList, name: ydName, description = "", visible = {}, type, direction, time: ydTime = null, listup } = y.data;
    const list = y.list.map((item) => {
      const { time = null, ..._item } = item
      const mediaImageItem: MediaImageItemType = { ..._item, time: (time ? new Date(time) : null) }
      return mediaImageItem;
    });
    const name = ydName || y.dir;
    const time = ydTime ? new Date(ydTime) : null;
    return { dir: y.dir, list, name, description, listup, visible, time, type, direction }
  })
}

export async function GetMediaImageAlbums(args: GetYamlImageListProps) {
  return GetMediaImageAlbumFromYamls(
    await GetYamlImageList(args)
  );
}

export function CastMediaImagesFromAlbums(albums: MediaImageAlbumType[]): MediaImageItemType[] {
  const items: MediaImageItemType[] = [];
  albums.forEach((group) => {
    group.list.forEach((item) => {
      item.album = group;
      items.push(item);
    })
  })
  return items;
}

export async function GetMediaImages(args: GetYamlImageListProps) {
  return CastMediaImagesFromAlbums(
    await GetMediaImageAlbums(args)
  );
}
