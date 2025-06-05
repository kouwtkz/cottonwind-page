import { useEffect } from "react";
import { Link } from "react-router";
import { test } from "~/.client/test";
// import { CharacterState } from "~/components/state/CharacterState";

export function TopPage() {
  // const [data, setData] = useData();
  // useEffect(() => {
  //   if (!data) {
  //     fetch("/api")
  //       .then((data) => data.json())
  //       .then((data) => {
  //         setData(data);
  //       });
  //   }
  // }, []);
  // useEffect(() => {
  //   console.log(data);
  // }, [data]);
  useEffect(() => {
    test();
  });
  return (
    <>
      <h1>top page !</h1>
      <Link to="/character">キャラページ</Link>
    </>
  );
}
