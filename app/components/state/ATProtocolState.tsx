import { useEffect, useMemo, useRef } from "react";
import { CreateObjectState } from "./CreateState";
import { useEnv } from "./EnvState";
import { FormatDate } from "../functions/DateFunction";
import { ATProtocolEnv } from "~/Env";
import Hls from "hls.js";

export const useATProtoState = CreateObjectState<ATProtoStateType>((set) => ({
  GetPosts(props: BlueskyFeedGetPostProps = {}) {
    set({ _getPostProps: props });
  },
}));

export function ATPState() {
  return (
    <>
      <_ATPState />
      <_SetHandle />
      {ATProtocolEnv.setDidInfo ? <_SetDidInfo /> : null}
      {ATProtocolEnv.setDescribe ? <_SetDescribe /> : null}
      {ATProtocolEnv.setLinkat ? <_SetLinkat /> : null}
      {ATProtocolEnv.getPosts ? <_GetPosts /> : null}
    </>
  );
}

function _ATPState() {
  const { ...v } = useATProtoState();
  useEffect(() => {
    // console.log(v);
  }, [v]);
  return <></>;
}

function _SetHandle() {
  const handle = useEnv()[0]?.BLUESKY_HANDLE;
  const { Set } = useATProtoState();
  useEffect(() => {
    if (handle) {
      Set({ handle });
      const didReqUrl = new URL(
        "https://bsky.social/xrpc/com.atproto.identity.resolveHandle"
      );
      didReqUrl.searchParams.set("handle", handle);
      fetch(didReqUrl, { mode: "cors" })
        .then((r) => {
          if (r.status === 200) {
            return r.json();
          } else {
            return { did: "" };
          }
        })
        .then((json) => {
          Set(json as object);
        });
    }
  }, [handle]);
  return <></>;
}

function _SetDidInfo() {
  const { Set, did } = useATProtoState();
  useEffect(() => {
    if (did) {
      const didInfoUrl = new URL("https://plc.directory/");
      didInfoUrl.pathname = did.replaceAll(":", "%3A");
      fetch(didInfoUrl, { mode: "cors" })
        .then<didInfoType | null>((r) => {
          if (r.status === 200) {
            return r.json();
          } else {
            return null;
          }
        })
        .then((didInfo) => {
          let endpoint: string;
          if (didInfo) {
            const dataServer = didInfo?.service.find(
              ({ type: Type }) => Type === "AtprotoPersonalDataServer"
            );
            if (dataServer) {
              endpoint = dataServer.serviceEndpoint;
              Set({ endpoint: dataServer.serviceEndpoint });
            } else endpoint = "";
          } else endpoint = "";
          Set({ didInfo, endpoint });
        });
    } else if (did === "") {
      Set({ didInfo: null, endpoint: "" });
    }
  }, [did]);
  return <></>;
}
function _SetDescribe() {
  const { Set, did, endpoint } = useATProtoState();

  useEffect(() => {
    if (did && endpoint) {
      const Url = new URL(endpoint);
      Url.pathname = "/xrpc/com.atproto.repo.describeRepo";
      Url.searchParams.set("repo", did);
      fetch(Url, { mode: "cors" })
        .then<ATDescribeType | null>((r) => {
          if (r.status === 200) {
            return r.json();
          } else {
            return null;
          }
        })
        .then((describe) => {
          Set({ describe });
        });
    } else if (did === "" || endpoint === "") {
      Set({ describe: null });
    }
  }, [did, endpoint]);
  return <></>;
}

function _SetLinkat() {
  const { Set, did, endpoint, describe } = useATProtoState();
  useEffect(() => {
    if (did && endpoint && describe) {
      if (describe.collections.findIndex((v) => v === "blue.linkat.board")) {
        const Url = new URL(endpoint);
        Url.pathname = "/xrpc/com.atproto.repo.listRecords";
        Url.searchParams.set("repo", did);
        Url.searchParams.set("collection", "blue.linkat.board");
        Url.searchParams.set("limit", "50");
        fetch(Url, { mode: "cors" })
          .then<ATListRecordType<LinkatRecordType>>((r) => {
            if (r.status === 200) {
              return r.json();
            } else {
              throw "";
            }
          })
          .then((record) => {
            const linkat = record.records.reduce<Array<LinkatType>>((a, c) => {
              c.value.cards.forEach((card) => {
                a.push(card);
              });
              return a;
            }, []);
            Set({ linkat });
          })
          .catch(() => {
            Set({ linkat: [] });
          });
      } else {
        Set({ linkat: [] });
      }
    } else {
      Set({ linkat: [] });
    }
  }, [did, endpoint, describe]);
  return <></>;
}

function _GetPosts() {
  const { Set, did, _getPostProps } = useATProtoState();
  useEffect(() => {
    if (did && _getPostProps) {
      const Url = new URL("https://public.api.bsky.app");
      Url.pathname = "/xrpc/app.bsky.feed.getAuthorFeed";
      Url.searchParams.set("actor", did);
      if (_getPostProps.limit)
        Url.searchParams.set("limit", _getPostProps.limit.toString());
      if (_getPostProps.cursor)
        Url.searchParams.set("cursor", _getPostProps.cursor);
      if (_getPostProps.filter)
        Url.searchParams.set("filter", _getPostProps.filter);
      if (_getPostProps.pin) Url.searchParams.set("includePins", "1");
      fetch(Url, { mode: "cors" })
        .then<BlueskyFeedType>((r) => {
          if (r.status === 200) {
            return r.json();
          } else {
            throw "";
          }
        })
        .then((json) => {
          return json.feed.reduce<Array<BlueskyFeedPostType>>((a, { post }) => {
            a.push(post);
            return a;
          }, []);
        })
        .then((posts) => {
          Set({ posts });
        })
        .catch(() => {
          Set({ posts: [] });
        });
    } else if (did === "") {
      Set({ posts: [] });
    }
  }, [did, _getPostProps]);
  return <></>;
}

export function BlueskyFeed() {
  const { posts, GetPosts, handle, did } = useATProtoState();
  const host = "https://bsky.app/";
  const profileBaseUrl = useMemo(() => {
    const Url = new URL(host);
    Url.pathname += "profile/";
    return Url;
  }, [host, handle]);
  const profileUrl = useMemo(() => {
    const Url = new URL(profileBaseUrl);
    if (handle) {
      Url.pathname += handle;
    }
    return Url;
  }, [profileBaseUrl, handle]);
  const postBaseUrl = useMemo(() => {
    const Url = new URL(profileUrl);
    Url.pathname += "/post/";
    return Url;
  }, [profileUrl]);
  useEffect(() => {
    if (!posts) GetPosts({ filter: "posts_with_replies" });
  }, [posts]);
  const filteredMap = useMemo(() => {
    return posts?.reduce<Map<string, BlueskyFeedPostType>>((map, c) => {
      if (!map.has(c.cid)) map.set(c.cid, c);
      return map;
    }, new Map());
  }, [posts]);
  const Feed = useMemo(
    () => (
      <div className="feedBox">
        <table>
          <tbody>
            {filteredMap
              ? Array.from(filteredMap.values())
                  .filter(
                    (post) =>
                      post.author.did === did &&
                      (!post.record.reply ||
                        post.record.reply.parent.uri.match(
                          post.author.did + "/"
                        ))
                  )
                  .map((post, i) => (
                    <PostItem post={post} postBaseUrl={postBaseUrl} key={i} />
                  ))
              : null}
          </tbody>
        </table>
      </div>
    ),
    [filteredMap, postBaseUrl]
  );
  return (
    <div className="BlueskyFeed">
      {posts ? (
        <>
          <h3 className="title en-title-font color-main">
            <a href={profileUrl.href} target="_blank">
              Bluesky
            </a>
          </h3>
          {Feed}
        </>
      ) : null}
    </div>
  );
}

function PostItem({
  post,
  postBaseUrl,
}: {
  post: BlueskyFeedPostType;
  postBaseUrl: URL;
}) {
  const Url = new URL(postBaseUrl);
  Url.pathname += post.uri.slice(post.uri.lastIndexOf("/") + 1);
  const time = new Date(post.record.createdAt);
  return (
    <tr className="item">
      <td>
        <div>
          {post.record.text
            .split("\n")
            .reduce<Array<React.ReactNode>>((a, c, i) => {
              if (a.length > 0) a.push(<br key={`br_${i}`} />);
              a.push(c);
              return a;
            }, [])}
        </div>
        {post.embed ? (
          <div className="embed">
            {post.embed.$type === "app.bsky.embed.images#view" &&
            post.embed.images.length > 0
              ? post.embed.images.map((image, i) => (
                  <img key={i} alt={image.alt} src={image.thumb} />
                ))
              : null}
            {post.embed.$type === "app.bsky.embed.video#view" ? (
              <EmbedVideoProps video={post.embed} />
            ) : null}
          </div>
        ) : null}
        <div className="time">
          <a href={Url.href} target="_blank">
            {FormatDate(time)}
          </a>
        </div>
      </td>
    </tr>
  );
}

interface EmbedVideoProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src"> {
  video: BlueskyFeedPostEmbedVideoViewType;
}
function EmbedVideoProps({ video, ...props }: EmbedVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (Hls.isSupported()) {
      const videoRef = ref.current!;
      var hls = new Hls();
      hls.loadSource(video.playlist); // Load the HLS manifest
      hls.attachMedia(videoRef); // Attach to video element
      // hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // });
    }
  }, [video]);
  return (
    <video
      ref={ref}
      loop
      controls
      width={video.aspectRatio.width}
      height={video.aspectRatio.height}
      {...props}
    />
  );
}
