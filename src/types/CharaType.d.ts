
interface CharaType {
  name: string,
  honorific?: string,
  defEmoji?: string,
  overview?: string,
  description?: string,
  tags?: string[],
  path?: string,
  icon?: string,
  image?: string,
  headerImage?: string,
  embed?: string,
  playlist?: string[],
  id: string
  time?: Date,
  birthday?: Date,
  media?: {
    icon?: MediaImageItemType | null,
    image?: MediaImageItemType | null,
    headerImage?: MediaImageItemType | null,
    playlist?: SoundPlaylistType,
  },
  [k: string]: any
}

interface CharaObjectType {
  [name: string]: CharaType
}

interface CharaDataType extends Omit<CharaType, "time" | "birthday" | "id"> {
  time?: string
  birthday?: string,
}

interface CharaDataObjectType {
  [name: string]: CharaDataType
}
