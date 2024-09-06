interface convertCharaDataProps {
  data: any;
  convert?: (CharaType: CharacterType) => void;
}
export function convertCharaData({ data, convert }: convertCharaDataProps) {
  const charaData: OldCharaObjectType = data;
  const charaList = Object.values(charaData) as CharacterType[];
  charaList.forEach((chara) => {
    if (typeof chara.time === "string") chara.time = new Date(chara.time);
    if (typeof chara.birthday === "string") chara.birthday = new Date(chara.birthday);
    if (convert) convert(chara);
  })
  return charaData;
}

export function convertCharaList(charactersData: OldCharaObjectType) {
  return (Object.entries(charactersData) as [string, CharacterType][])
    .map(([id, chara]) => (
      {
        ...chara, id,
        time: (chara.time ? new Date(chara.time) : undefined),
        birthday: (chara.birthday ? new Date(chara.birthday) : undefined)
      } as CharacterType));
}
