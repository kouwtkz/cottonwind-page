import { useEffect } from "react";
import { Link } from "react-router";
import { CreateState } from "~/components/state/CreateState";
const useData = CreateState<any>();

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
  return (
    <>
      <h1>top page !</h1>
      <Link to="/characters">キャラページ</Link>
    </>
  );
}
