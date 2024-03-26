
import { MediaImageItemType } from "./MediaImageDataType";
import { PlaylistType } from "./MediaSoundType";

interface CharaTypeBase {
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
  media?: {
    icon?: MediaImageItemType | null,
    image?: MediaImageItemType | null,
    headerImage?: MediaImageItemType | null,
    playlist?: PlaylistType,
  },
  [k: string]: any
}

export interface CharaType extends CharaTypeBase {
  id: string
  time?: Date,
}

export interface CharaObjectType {
  [name: string]: CharaType
}

export interface CharaDataType extends CharaTypeBase {
  time?: string
}

export interface CharaDataObjectType {
  [name: string]: CharaDataType
}
