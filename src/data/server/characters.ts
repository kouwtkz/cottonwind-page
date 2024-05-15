import { convertCharaData, convertCharaList } from "../../data/functions/convertCharaData";
import data from "../../../public/json/characters.json"

export const serverCharacters = convertCharaData({ data });

export const serverCharacterList = convertCharaList(serverCharacters);
