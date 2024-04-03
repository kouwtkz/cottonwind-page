
import { MediaImageItemType } from "./MediaImageDataType";
import { PlaylistType } from "./MediaSoundType";

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
    playlist?: PlaylistType,
  },
  [k: string]: any
}

export interface CharaObjectType {
  [name: string]: CharaType
}

export interface CharaDataType extends Omit<CharaType, "time" | "birthday" | "id"> {
  time?: string
  birthday?: string,
}

export interface CharaDataObjectType {
  [name: string]: CharaDataType
}
