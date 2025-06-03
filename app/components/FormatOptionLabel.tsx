import { ImageMeeIcon } from "~/components/layout/ImageMee";
import { CharacterName, translateCharaLangName } from "~/components/routes/CharacterPage";

export type labelValue = { label?: string; value?: string };

export function charaTagsLabel(
  charactersMap: Map<string, CharacterType>,
  lang?: string
) {
  return function (data: unknown) {
    const option: labelValue = data && typeof data === "object" ? data : {};
    const character = option?.value ? charactersMap?.get(option.value) : null;
    return (
      <div className="flex items-center justify-start">
        {character ? (
          <>
            <span className="label-sl">
              {character.icon ? (
                <ImageMeeIcon
                  imageItem={character.icon}
                  className="charaIcon"
                />
              ) : (
                <div className="charaIcon">{character?.defEmoji}</div>
              )}
            </span>
            <CharacterName chara={character} />
          </>
        ) : null}
      </div>
    );
  };
}
