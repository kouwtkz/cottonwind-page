import { ImageMeeIcon } from "@/layout/ImageMee";

export type labelValue = { label?: string; value?: string };

export function charaTagsLabel(charactersMap: Map<string, CharacterType>) {
  return function (data: unknown) {
    const option: labelValue = data && typeof data === "object" ? data : {};
    const character = option?.value ? charactersMap?.get(option.value) : null;
    return (
      <div className="flex items-center justify-start">
        <span className="label-sl">
          {character?.media?.icon ? (
            <ImageMeeIcon
              imageItem={character.media.icon}
              className="charaIcon"
            />
          ) : (
            <div className="charaIcon">{character?.defEmoji}</div>
          )}
        </span>
        <span>{character?.name}</span>
      </div>
    );
  };
}
