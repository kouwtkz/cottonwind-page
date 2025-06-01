import { Link } from "react-router";

export function TopPage() {
  return (
    <>
      <h1>top page !</h1>
      <Link to="/characters">キャラページ</Link>
    </>
  );
}
