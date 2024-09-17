interface SoundDataType {
  id: number;
  key: string;
  src?: string;
  track?: number;
  title?: string;
  description?: string;
  album?: string;
  category?: string;
  cover?: string;
  draft?: number;
  time?: string;
  lastmod?: string;
}

interface SoundAlbumType {
  title: string;
  src: string;
  name: string;
  playlist?: SoundPlaylistType[];
  setupSound?: string;
  dir?: string;
}

interface SoundPlaylistType {
  dir?: string;
  title?: string;
  list: SoundItemType[];
}

interface SoundItemType extends SoundDataType {
  src: string;
  dir?: string;
  title: string;
  setup?: boolean;
  category?: string[];
}

type SoundLoopMode = "off" | "loop" | "loopOne" | "playUntilEnd";