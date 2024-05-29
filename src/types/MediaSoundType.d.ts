type SoundAlbumType = {
  title: string;
  src: string;
  name: string;
  playlist?: SoundPlaylistType[];
  setupSound?: string;
  dir?: string;
}

type SoundPlaylistType = {
  dir?: string;
  title?: string;
  list: SoundItemType[];
}

type SoundItemType = {
  src: string;
  dir?: string;
  title: string;
  setup?: boolean;
}

type SoundLoopMode = "off" | "loop" | "loopOne" | "playUntilEnd";