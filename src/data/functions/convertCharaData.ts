import { CharaObjectType, CharaType } from "../../types/CharaType";

interface convertCharaDataProps {
  data: any;
  convert?: (CharaType: CharaType) => void;
}
export function convertCharaData({ data, convert }: convertCharaDataProps) {
  const charaData: CharaObjectType = data;
  const charaList = Object.values(charaData);
  charaList.forEach((chara) => {
    if (typeof chara.time === "string") chara.time = new Date(chara.time);
    if (typeof chara.birthday === "string") chara.birthday = new Date(chara.birthday);
    if (convert) convert(chara);
  })
  return charaData;
}

export function convertCharaList(charactersData: CharaObjectType) {
  return Object.entries(charactersData)
    .map(([id, chara]) => (
      {
        ...chara, id,
        time: (chara.time ? new Date(chara.time) : undefined),
        birthday: (chara.birthday ? new Date(chara.birthday) : undefined)
      } as CharaType));
}
