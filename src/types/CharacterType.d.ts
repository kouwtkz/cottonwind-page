interface CharacterDataType {
  id: number;
  key: string;
  name: string;
  enName?: string;
  honorific?: string;
  nameGuide?: string;
  defEmoji?: string;
  overview?: string;
  description?: string;
  tags?: string;
  order?: number;
  draft?: number;
  playlist?: string;
  icon?: string;
  image?: string;
  headerImage?: string;
  embed?: string;
  birthday?: string;
  time?: string;
  lastmod: string;
}

interface CharacterType extends Omit<CharacterDataType, "tags" | "playlist" | "birthday" | "time" | "lastmod">, WithRawDataType<CharacterDataType> {
  tags?: string[],
  playlist?: string[],
  draft?: boolean,
  time?: Date,
  birthday?: Date,
  lastmod?: Date,
  visible?: boolean;
  like?: LikeType;
  media?: {
    icon?: ImageType | null,
    image?: ImageType | null,
    headerImage?: ImageType | null,
    playlist?: SoundPlaylistType,
  },
}

type characterImageMediaMode = "icon" | "image" | "headerImage";
type characterImageMode = characterImageMediaMode | "body";
