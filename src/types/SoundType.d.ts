interface SoundDataType {
  id?: number;
  key: string;
  src?: string;
  track?: number;
  title?: string;
  description?: string;
  album?: string;
  cover?: string;
  artist?: string;
  grouping?: string;
  genre?: string;
  draft?: number;
  time?: string;
  mtime?: string;
  lastmod?: string;
}

interface SoundItemType extends SoundDataType {
  genre?: string[];
  grouping?: string[];
  draft?: boolean;
  time?: Date;
  lastmod?: Date;
}

interface SoundPlaylistType {
  title?: string;
  list: SoundItemType[];
}

interface SoundAlbumDataType {
  id?: number;
  key: string;
  title?: string;
  description?: string;
  order?: number;
  artist?: string;
  cover?: string;
  category?: string;
  setup?: number;
  draft?: number;
  time?: string;
  lastmod?: string;
}

interface SoundAlbumType extends SoundAlbumDataType {
  playlist?: SoundPlaylistType;
  setup?: boolean;
  draft?: boolean;
  time?: Date;
  lastmod?: Date;
}

type SoundLoopMode = "off" | "loop" | "loopOne" | "playUntilEnd";
