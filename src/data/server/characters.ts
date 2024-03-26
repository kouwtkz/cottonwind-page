import { convertCharaData, convertCharaList } from "../../data/functions/convertCharaData";
import data from "../../../public/static/data/characters.json"

export const serverCharacters = convertCharaData({ data });

export const serverCharacterList = convertCharaList(serverCharacters);
