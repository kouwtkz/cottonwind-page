import { GetYamlImageList } from "../../mediaScripts/GetImageList.mjs";
import { readCharaObject, writeCharaObject } from "./FunctionsCharaData.mjs";
import { fromto } from "../../mediaScripts/UpdateOption.mjs";
import { UpdateImageYaml } from "../../mediaScripts/UpdateImage.mjs";
import { MediaUpdate } from "../../mediaScripts/DataUpdateProcess.mjs";

export async function SetCharaData(formData: FormData) {
  const res = { message: "", update: { chara: false, image: false } };
  const charaList = Object.entries(readCharaObject(false)!);
  const target = formData.get("target")?.toString();
  if (target) formData.delete("target");
  const id = formData.get("id")?.toString();
  if (id) formData.delete("id");
  const formArray: { key: string, value: string | string[] }[] = [];
  formData.forEach((value, key) => {
    value = value.toString();
    if (key.endsWith("[]")) {
      const _key = key.slice(0, -2);
      const found = formArray.find(({ key }) => key === _key);
      if (found) {
        if (Array.isArray(found.value)) found.value.push(value);
        else found.value = [found.value, value];
      } else formArray.push({ key: _key, value: [value] });
    } else {
      formArray.push({ key, value })
    }
    return formArray;
  })
  const sortsIndex = formArray.findIndex(({ key }) => key === "sorts")
  if (sortsIndex >= 0) {
    const sorts = formArray[sortsIndex];
    if (!Array.isArray(sorts.value)) sorts.value = sorts.value.split(",");
    sorts.value.forEach((id, i) => {
      const found = charaList.find(([key]) => key === id)
      if (found) found[1]._index = i;
    });
    charaList.sort((a, b) => {
      return (a[1]._index - b[1]._index)
    })
    charaList.forEach(([key, value]) => {
      delete value._index;
    })
    delete formArray[sortsIndex];
  }
  if (target || id) {
    const charaIndex = target ? charaList.findIndex(([key]) => key === target) : -1;
    const chara = charaIndex >= 0 ? charaList[charaIndex][1] : {} as CharaType;
    formArray.forEach(({ key, value }) => {
      if (value !== "") {
        chara[key] = value;
      } else {
        delete chara[key];
      }
    })
    if (id) {
      if (charaIndex >= 0) {
        charaList[charaIndex][0] = id;
        const yamls = await GetYamlImageList({ ...fromto, filter: { listup: true } });
        const symls = yamls.filter(({ data }) => data.list?.some(({ tags }) => tags?.some(t => t === target)))
        symls.forEach(({ data }) => data.list?.forEach(({ tags }) => {
          if (tags) {
            const i = tags.findIndex(t => t === target);
            if (i >= 0) tags[i] = id;
          }
        }))
        res.update.image = true;
        await UpdateImageYaml({ yamls: symls, deleteImage: false, ...fromto })
        MediaUpdate("image");
      }
      else charaList.push([id, chara]);
    }
  }
  writeCharaObject(Object.fromEntries(charaList));
  MediaUpdate("character");
  res.update.chara = true;
  res.message = "更新に成功しました";
  return res;
}