interface CharacterDataType {
  id: number;
  key: string;
  name: string;
  honorific?: string;
  defEmoji?: string;
  overview?: string;
  description?: string;
  tags?: string;
  order?: number;
  playlist?: string;
  icon?: string;
  image?: string;
  headerImage?: string;
  embed?: string;
  birthday?: string;
  time?: string;
  lastmod: string;
}

interface CharacterType extends Omit<CharacterDataType, "tags" | "playlist" | "birthday" | "time" | "lastmod"> {
  tags?: string[],
  playlist?: string[],
  time?: Date,
  birthday?: Date,
  lastmod?: Date,
  media?: {
    icon?: ImageType | null,
    image?: ImageType | null,
    headerImage?: ImageType | null,
    playlist?: SoundPlaylistType,
  },
}

type characterImageMode = "icon" | "image" | "headerImage";
