import { Suspense } from "react";
import PagingArea from "./PagingArea";
import SearchArea from "./SearchArea";
import PostButton from "./PostButton";
import HandsClapButton from "./HandsClapButton";
import { useManageState } from "@/state/StateSet";

type props = { max?: number };

export default function Fixed({ max }: props) {
  const isLogin = import.meta.env.DEV || useManageState().isLogin;
  return (
    <Suspense>
      <div className="fixed rightBottom">
        <div className="list">
          <PagingArea max={max} />
          <div className="list">
            <SearchArea />
            {isLogin ? <PostButton /> : <HandsClapButton />}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
