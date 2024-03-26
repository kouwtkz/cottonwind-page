import { MediaImageAlbumType } from "../../types/MediaImageDataType";
import { getCopyRightList, getTagList, parseImageItems } from "../functions/images";
import data from "../../../public/static/data/images.json"

export const serverImageAlbumList: MediaImageAlbumType[] = data as any;
export const serverImageItemList = parseImageItems(serverImageAlbumList)

export const serverImageTagList = getTagList(serverImageItemList);

export const serverImageCopyrightList = getCopyRightList(serverImageItemList);
