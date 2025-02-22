import { ImageMeeIcon } from "@/layout/ImageMee";
import { setCharaLangName } from "@/routes/CharacterPage";

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
              {character.media?.icon ? (
                <ImageMeeIcon
                  imageItem={character.media.icon}
                  className="charaIcon"
                />
              ) : (
                <div className="charaIcon">{character?.defEmoji}</div>
              )}
            </span>
            <span>{setCharaLangName(character, lang)}</span>
          </>
        ) : null}
      </div>
    );
  };
}
