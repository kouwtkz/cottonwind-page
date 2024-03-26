import { Link, useParams } from "react-router-dom";
import { ImageMeeIcon } from "../components/image/ImageMee";
import { useCharaState } from "../state/CharaState";

function CharaDetail({ charaName }: { charaName: string }) {
  const { charaObject } = useCharaState();
  if (!charaObject) return <></>;
  const chara = charaObject[charaName];
  return (
    <>
      <div className="mb-4">
        <h1 className="text-main-strong font-bold text-3xl h-10 inline-block">
          {chara.media?.icon ? (
            <ImageMeeIcon
              imageItem={chara.media.icon}
              size={40}
              className="charaIcon text-4xl mr-2"
            />
          ) : null}
          <span className="align-middle">
            {chara.name + (chara.honorific ?? "")}
          </span>
        </h1>
        <div className="text-main text-xl my-2">{chara.overview}</div>
      </div>
      <div>{chara.description}</div>
    </>
  );
}

export function CharaPage() {
  const { charaList } = useCharaState();
  const { name: charaName } = useParams();
  return (
    <div className="charaPage">
      {charaName ? (
        <CharaDetail charaName={charaName} />
      ) : (
        <div className="list">
          {charaList.map((chara, i) => {
            return (
              <Link
                to={`/character/${chara.id}`}
                className="item"
                key={chara.id}
              >
                {chara.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
