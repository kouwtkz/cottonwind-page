import { Link } from "react-router";
import { CreateState } from "~/components/state/CreateState";
const useFlag = CreateState(false);

export function TopPage() {
  const [flag, setFlag] = useFlag();
  return (
    <>
      <h1>top page !</h1>
      <Link to="/characters">キャラページ</Link>
      <div
        className="pointer"
        onClick={() => {
          setFlag((f) => !f);
        }}
      >
        {String(flag)}
      </div>
    </>
  );
}
