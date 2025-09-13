import { CharacterPage } from "~/page/CharacterPage";
import type { Route } from "./+types/character";
import {
  charactersDataIndexed,
  imageDataIndexed,
  waitIdb,
} from "~/data/ClientDBLoader";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { getCfDB } from "~/data/cf/getEnv";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { charaTableObject } from "./api/character";
import { ImageTableObject } from "./api/image";

export async function loader({ context, params }: Route.LoaderArgs) {
  const db = getCfDB({ context });
  let character: CharacterDataType | undefined;
  let imageItem: ImageDataType | undefined;
  if (db) {
    character = await charaTableObject
      .Select({ db, where: { key: params.charaName } })
      .then((c) => c[0]);
    if (character?.image) {
      imageItem = await ImageTableObject.Select({
        db,
        where: { key: character.image },
      }).then((c) => c[0]);
    }
  }
  return { character, imageItem };
}

let clientServerData: {
  character?: CharacterDataType;
  imageItem?: ImageDataType;
} = {};
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await waitIdb;
  if (clientServerData.character?.name !== params.charaName) {
    clientServerData.character = await charactersDataIndexed.table
      .get({
        index: "key",
        query: params.charaName,
      })
      .then((v) => v?.rawdata);
  }
  return clientServerData;
}
clientLoader.hydrate = true;

export function meta({ data: argsData, matches }: Route.MetaArgs) {
  const character = argsData?.character;
  const imageItem = argsData?.imageItem;
  const metaData = { ...getDataFromMatches(matches)?.data };
  metaData.title = "キャラクター";
  if (character) {
    metaData.title = character.name + " - " + metaData.title;
    if (character.overview) metaData.description = character.overview;
    if (imageItem) {
      const imageUrl = new URL(
        concatOriginUrl(metaData.mediaOrigin, imageItem.src)
      );
      if (imageItem.version) {
        imageUrl.searchParams.append("v", imageItem.version.toString());
      }
      metaData.image = imageUrl.href;
    }
  }
  if (!metaData.description)
    metaData.description = "わたかぜコウのキャラクター";
  return SetMetaDefault(metaData);
}

export default function Character({ params }: Route.ComponentProps) {
  return <CharacterPage charaName={params.charaName} />;
}
