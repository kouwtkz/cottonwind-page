interface CharacterDataType {
  index: number;
  id: string;
  name: string;
  honorific?: string;
  defEmoji?: string;
  overview?: string;
  description?: string;
  tags?: string;
  playlist?: string;
  icon?: string;
  image?: string;
  headerImage?: string;
  embed?: string;
  birthday?: string;
  time?: string;
  mtime: string;
}

interface CharacterType extends Omit<CharacterDataType, "tags" | "playlist" | "birthday" | "time" | "mtime"> {
  tags?: string[],
  playlist?: string[],
  time?: Date,
  birthday?: Date,
  mtime?: Date,
  media?: {
    icon?: ImageType | null,
    image?: ImageType | null,
    headerImage?: ImageType | null,
    playlist?: SoundPlaylistType,
  },
}