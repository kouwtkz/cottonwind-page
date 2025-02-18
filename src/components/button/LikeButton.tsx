import { HTMLAttributes, useMemo } from "react";
import { RiHeart3Fill } from "react-icons/ri";
import { toast } from "react-toastify";
import { toastLoadingOptions } from "../define/toastContainerDef";
import { useLocation } from "react-router-dom";
import { toLikePath } from "@/functions/likeFunction";
import { likeDataObject } from "@/state/DataState";
import axios from "axios";
import { useApiOrigin } from "@/state/EnvState";
import { concatOriginUrl } from "@/functions/originUrl";

interface LikeButtonProps extends HTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}
export function LikeButton({
  className,
  children,
  onClick,
  checked,
  title,
  ...props
}: LikeButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const { pathname, search } = useLocation();
  const pathKey = useMemo(
    () => toLikePath(pathname + search),
    [pathname, search]
  );
  const likeData = likeDataObject.useData()[0];
  const setLikeDataLoad = likeDataObject.useLoad()[1];
  const thisLikeData = useMemo(
    () => likeData?.find(({ path }) => path === pathKey),
    [likeData, pathKey]
  );
  checked = useMemo(() => {
    if (typeof checked === "boolean") return checked;
    else {
      return Boolean(thisLikeData?.checked);
    }
  }, [checked, thisLikeData]);
  className = useMemo(() => {
    const list = ["like"];
    if (checked) list.push("checked");
    if (className) list.push(className);
    return list.join(" ");
  }, [className, checked]);
  title = useMemo(() => {
    if (title) return title;
    else if (checked) return "いいねを外す";
    else return "いいねを付ける";
  }, [title, checked]);
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        if (checked) {
          axios
            .post(concatOriginUrl(apiOrigin, "like/send"), {
              path: pathKey,
              mode: "remove",
            } as LikeFormType)
            .then(() => {
              setLikeDataLoad("no-cache");
              toast("いいねを解除しました", toastLoadingOptions);
            });
        } else {
          axios
            .post(concatOriginUrl(apiOrigin, "like/send"), {
              path: pathKey,
              mode: "add",
            } as LikeFormType)
            .then(() => {
              setLikeDataLoad("no-cache");
              toast("いいねしました", toastLoadingOptions);
            });
        }
        if (onClick) onClick(e);
      }}
      title={title}
      {...props}
    >
      <RiHeart3Fill />
      <span className="count">{thisLikeData?.count || 0}</span>
      {children}
    </button>
  );
}
