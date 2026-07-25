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

interface CharacterIndexedDataType extends Omit<CharacterDataType, "tags" | "playlist">, WithRawExtendDataType<CharacterDataType> {
  tags?: string[],
  playlist?: string[],
  draft?: boolean,
  visible?: boolean;
}

interface CharacterType extends Omit<CharacterIndexedDataType, "birthday" | "time" | "lastmod" | "icon" | "image" | "headerImage">, WithRawExtendDataType<CharacterDataType> {
  time?: Temporal.ZonedDateTime,
  birthday?: Temporal.ZonedDateTime,
  lastmod?: Temporal.ZonedDateTime,
  tagsMap?: Map<string, void>,
  soundPlaylist?: SoundPlaylistType,
  like?: LikeType;
  icon?: ImageType | null,
  image?: ImageType | null,
  headerImage?: ImageType | null,
}

type characterImageMediaMode = "icon" | "image" | "headerImage";
type characterImageMode = characterImageMediaMode | "body";
