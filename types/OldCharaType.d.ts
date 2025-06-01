interface OldCharaObjectType {
  [name: string]: CharacterType | undefined
}

interface OldCharaDataObjectType {
  [name: string]: Omit<CharacterDataType, "id"> & { id: unknown }
}
