import { HTMLAttributes, useEffect, useMemo, useState } from "react";
import { RiHeart3Fill } from "react-icons/ri";
import { toast } from "react-toastify";
import { toastLoadingOptions } from "../define/toastContainerDef";
import { useLocation } from "react-router-dom";
import { toLikePath } from "@/functions/likeFunction";
import { likeDataIndexed } from "@/data/DataState";
import axios from "axios";
import { useApiOrigin } from "@/state/EnvState";
import { concatOriginUrl } from "@/functions/originUrl";
import { useLikeState } from "@/state/LikeState";

interface LikeButtonProps extends HTMLAttributes<HTMLButtonElement> {
  url?: string;
  checked?: boolean;
}
export function LikeButton({
  url,
  checked,
  className,
  children,
  onClick,
  title,
  ...props
}: LikeButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const { pathname, search } = useLocation();
  if (!url) url = pathname + search;
  const pathKey = useMemo(() => toLikePath(url), [url]);
  const { likeMap } = useLikeState();
  const thisLikeData = useMemo(() => likeMap?.get(pathKey), [likeMap, pathKey]);
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
              likeDataIndexed.load("no-cache");
              toast("いいねを解除しました", toastLoadingOptions);
            });
        } else {
          axios
            .post(concatOriginUrl(apiOrigin, "like/send"), {
              path: pathKey,
              mode: "add",
            } as LikeFormType)
            .then(() => {
              likeDataIndexed.load("no-cache");
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
