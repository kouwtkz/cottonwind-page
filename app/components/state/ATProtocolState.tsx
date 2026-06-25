import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import { CreateObjectState } from "./CreateState";
import { useEnv } from "./EnvState";
import { FormatDate } from "../functions/DateFunction";
import Hls, { Events as hlsEvents } from "hls.js";
import { BiPin, BiRepost } from "react-icons/bi";
import { toast } from "react-toastify";
import { useImageViewer } from "../layout/ImageViewer";
import { MultiParser, type MultiParserProps } from "../parse/MultiParser";

export const useATProtoState = CreateObjectState<ATProtoStateType>((set) => ({
  GetPosts(props: BlueskyFeedGetPostProps = {}) {
    set({ _getPostProps: props });
  },
}));
export async function getATProtoRecords<T>({
  did,
  endpoint,
  describe,
  collection,
  limit,
}: ATProtoGetRecordsProps) {
  if (describe.collections.findIndex((v) => v === collection)) {
    const Url = new URL(endpoint);
    Url.pathname = "/xrpc/com.atproto.repo.listRecords";
    Url.searchParams.set("repo", did);
    Url.searchParams.set("collection", collection);
    if (limit) Url.searchParams.set("limit", limit.toString());
    return fetch(Url, { mode: "cors" })
      .then<ATListRecordType<T>>((r) => {
        if (r.status === 200) {
          return r.json();
        } else {
          throw "";
        }
      })
      .catch(() => {});
  }
}

export function ATPState() {
  return (
    <>
      <_ATPState />
      <_SetHandle />
      {import.meta.env.VITE_ATPROTO_USE_DID ? <_LoadDidInfo /> : null}
      {import.meta.env.VITE_ATPROTO_USE_DESCRIBE ? <_LoadDescribe /> : null}
      {import.meta.env.VITE_ATPROTO_USE_LINKAT ? <_LoadLinkat /> : null}
      {import.meta.env.VITE_ATPROTO_USE_POSTS ? <_LoadPosts /> : null}
      {import.meta.env.VITE_ATPROTO_USE_MOCHOTT ? <_LoadMochott /> : null}
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
        "https://bsky.social/xrpc/com.atproto.identity.resolveHandle",
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
  }, [handle, Set]);
  return <></>;
}

function _LoadDidInfo() {
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
              ({ type: Type }) => Type === "AtprotoPersonalDataServer",
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
  }, [did, Set]);
  return <></>;
}
function _LoadDescribe() {
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
  }, [did, endpoint, Set]);
  return <></>;
}

function _LoadLinkat() {
  const { Set, did, endpoint, describe } = useATProtoState();
  useEffect(() => {
    if (did && endpoint && describe) {
      getATProtoRecords<LinkatRecordType>({
        did,
        endpoint,
        describe,
        collection: "blue.linkat.board",
      })
        .then((record) => {
          if (!record) throw "";
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
    }
  }, [did, endpoint, describe, Set]);
  return <></>;
}

function _LoadMochott() {
  const env = useEnv()[0];
  const { Set, did, endpoint, describe } = useATProtoState();
  useEffect(() => {
    if (env && did && endpoint && describe) {
      Promise.all([
        getATProtoRecords<Mochott_Profile>({
          did,
          endpoint,
          describe,
          collection: "site.mochott.profile",
        }),
        getATProtoRecords<Mochott_Raw_Minisite>({
          did,
          endpoint,
          describe,
          collection: "site.mochott.minisite",
        }),
        getATProtoRecords<Mochott_Raw_Article>({
          did,
          endpoint,
          describe,
          collection: "site.mochott.article",
        }),
      ]).then(([profile, minisite, article]) => {
        let mochott_Profile: Mochott_Profile | undefined;
        let mochott_Minisite: Array<Mochott_Minisite> | undefined;
        let mochott_Article: Array<Mochott_Article> | undefined;
        if (profile) {
          mochott_Profile = profile.records[0].value;
        }
        if (minisite) {
          mochott_Minisite = minisite.records.map((v) => {
            const minisite: Mochott_Minisite = v.value;
            if (
              env.MOCHOTT_MINISITE_DOMAIN &&
              v.value.globalSlug in env.MOCHOTT_MINISITE_DOMAIN
            ) {
              minisite.domain = env.MOCHOTT_MINISITE_DOMAIN[v.value.globalSlug];
            }
            return minisite;
          });
        }
        if (article) {
          const articleMap = article.records.reduce<
            Map<string, Mochott_Article>
          >((map, c) => {
            const key = c.value.path;
            map.set(key, c.value);
            return map;
          }, new Map());
          mochott_Article = Array.from(articleMap.values());
          mochott_Minisite?.forEach((minisite) => {
            minisite.articles.forEach((atUrl) => {
              const path = atUrl.slice(atUrl.lastIndexOf("/"));
              const article = articleMap.get(path);
              if (article) {
                article.minisite = minisite;
              }
            });
          });
          mochott_Article.forEach((article) => {
            let base: null | URL = null;
            if (article.minisite?.domain) {
              article.host = article.minisite.domain;
              base = new URL("https://" + article.host);
            } else {
              article.host = "mochott.site";
              base = mochott_Profile?.url ? new URL(mochott_Profile.url) : null;
            }
            if (base) {
              article.url = new URL(
                (base.pathname === "/" ? "" : base.pathname) +
                  (article.slug ? "/" + article.slug : article.path),
                base.href,
              );
            }
          });
        }
        Set({ mochott_Profile, mochott_Minisite, mochott_Article });
      });
    }
  }, [env, did, endpoint, describe, Set]);
  return <></>;
}

function _LoadPosts() {
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
      if (_getPostProps.pin)
        Url.searchParams.set("includePins", String(_getPostProps.pin));
      fetch(Url, { mode: "cors" })
        .then<BlueskyFeedType>((r) => {
          if (r.status === 200) {
            return r.json();
          } else {
            throw "";
          }
        })
        .then((json) => {
          return json.feed.reduce<Array<BlueskyFeedPostType>>(
            (a, { post, reason }) => {
              a.push({ ...post, reason });
              return a;
            },
            [],
          );
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
  }, [did, _getPostProps, Set]);
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
    if (!posts) GetPosts({ filter: "posts_with_replies", pin: true });
  }, [posts]);
  const list = useMemo(() => {
    const mapList = posts?.reduce<
      [Map<string, BlueskyFeedPostType[]>, Map<string, void>]
    >(
      (a, post) => {
        if (
          post.author.did === did &&
          (!post.record.reply ||
            post.record.reply.parent.uri.match(post.author.did + "/")) &&
          !a[1].has(post.cid)
        ) {
          a[1].set(post.cid);
          const tree_cid = post.record.reply?.root.cid || post.cid;
          const treeList = a[0].get(tree_cid);
          if (treeList) treeList.push(post);
          else a[0].set(tree_cid, [post]);
        }
        return a;
      },
      [new Map(), new Map()],
    );
    if (mapList) {
      const list = Array.from(mapList[0].values());
      let pinnedPost: BlueskyFeedPostType | null = null;
      if (list[0]?.[0]?.reason?.$type === "app.bsky.feed.defs#reasonPin") {
        pinnedPost = list[0][0];
      }
      list.sort((a, b) =>
        a[0].record.createdAt < b[0].record.createdAt ? 1 : -1,
      );
      if (pinnedPost) {
        if (list[0][0].cid === pinnedPost.cid) {
          pinnedPost = null;
        } else {
          const pinnedSamePost = pinnedPost;
          pinnedPost = { ...pinnedPost };
          delete pinnedSamePost.reason;
        }
      }
      list.forEach((posts) => {
        posts.sort((a, b) =>
          a.record.createdAt > b.record.createdAt ? 1 : -1,
        );
      });
      if (pinnedPost) list.unshift([pinnedPost]);
      return list;
    } else return [];
  }, [posts]);
  const Feed = useMemo(
    () => (
      <div className="feedBox">
        <table>
          <tbody>
            {list.map((tree, i) =>
              tree.map((post, j) => {
                return (
                  <PostItem
                    post={post}
                    postBaseUrl={postBaseUrl}
                    isTree={j > 0}
                    key={`${i}-${j}`}
                  />
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    ),
    [list, postBaseUrl],
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

export interface MultiParserWithFacetsProps
  extends Omit<MultiParserProps, "children"> {
  children: BlueskyFeedPostRecordType;
}
export function MultiParserWithFacets({
  children: record,
  ...props
}: MultiParserWithFacetsProps) {
  const children = useMemo(() => {
    const text = record.text;
    let cursor = 0;
    if (record.facets) {
      const encoder = new TextEncoder();
      const binText = Array.from(encoder.encode(text));
      const bin = [...record.facets]
        .sort((a, b) => a.index.byteStart - b.index.byteStart)
        .reduce<Array<number>>((bin, facet) => {
          bin.push(...binText.slice(cursor, facet.index.byteStart));
          const value = binText.slice(
            facet.index.byteStart,
            facet.index.byteEnd,
          );
          facet.features.forEach((feature) => {
            switch (feature.$type) {
              case "app.bsky.richtext.facet#mention":
                value.unshift(
                  ...Array.from(
                    encoder.encode(
                      `<a href="https://bsky.app/profile/${feature.did}" target="_blank">`,
                    ),
                  ),
                );
                value.push(...Array.from(encoder.encode(`</a>`)));
                break;
              case "app.bsky.richtext.facet#tag":
                value.unshift(
                  ...Array.from(
                    encoder.encode(
                      `<a href="https://bsky.app/hashtag/${feature.tag}" target="_blank">`,
                    ),
                  ),
                );
                value.push(...Array.from(encoder.encode(`</a>`)));
                break;
              case "app.bsky.richtext.facet#link":
                value.unshift(
                  ...Array.from(
                    encoder.encode(`<a href="${feature.uri}" target="_blank">`),
                  ),
                );
                value.push(...Array.from(encoder.encode(`</a>`)));
                break;
            }
          });
          bin.push(...value);
          cursor = facet.index.byteEnd;
          return bin;
        }, []);
      bin.push(...binText.slice(cursor));
      return new TextDecoder().decode(new Uint8Array(bin));
    } else return text;
  }, [record]);
  return (
    <MultiParser simpleBreak {...props}>
      {children}
    </MultiParser>
  );
}

function ATUriToBskyFeedUrl(uri: string) {
  return uri.replace(
    /^at:\/\/([^\/]+)\/app.bsky.feed.(generator|post)\/(.+)$/,
    (m, m1, m2, m3) => {
      let mode: string;
      switch (m2) {
        case "generator":
          mode = "feed";
          break;
        default:
          mode = "post";
          break;
      }
      return `https://bsky.app/profile/${m1}/${mode}/${m3}`;
    },
  );
}

function EmbedImage({
  cid,
  embed,
}: {
  cid: string;
  embed: BlueskyFeedPostEmbedImageViewType;
}) {
  const { setOpen: setOpenImageViewer } = useImageViewer();
  function ImageOnClick(image: BlueskyFeedPostEmbedImageViewItemType) {
    setOpenImageViewer({
      image: {
        id: -1,
        key: cid,
        title: image.alt,
        src: image.fullsize,
        thumbnail: image.thumb,
        hideInfo: true,
        ...image.aspectRatio,
      },
    });
  }
  return (
    <>
      {embed.images.map((image, i) => (
        <div className="imageItem" key={`image_${image.thumb}`}>
          <img
            alt={image.alt}
            src={image.thumb}
            tabIndex={0}
            onClick={() => ImageOnClick(image)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ImageOnClick(image);
            }}
          />
        </div>
      ))}
    </>
  );
}
function EmbedImageOrVideo({
  embed,
  cid,
}: {
  embed?: BlueskyFeedPostEmbedTypes | BlueskyFeedPostEmbedTypes[];
  cid: string;
}) {
  const embeds = embed ? (Array.isArray(embed) ? embed : [embed]) : [];
  return (
    <>
      {embeds.map((embed, i) => (
        <Fragment key={i}>
          {embed.$type === "app.bsky.embed.images#view" ? (
            <EmbedImage cid={cid} embed={embed} />
          ) : null}
          {embed.$type === "app.bsky.embed.video#view" ? (
            <EmbedVideoProps video={embed} />
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

function PostItem({
  post,
  postBaseUrl,
  isTree,
}: {
  post: BlueskyFeedPostType;
  postBaseUrl: URL;
  isTree?: boolean;
}) {
  const Url = new URL(postBaseUrl);
  Url.pathname += post.uri.slice(post.uri.lastIndexOf("/") + 1);
  const time = new Date(post.record.createdAt);
  let tdClass: string | undefined;
  if (isTree) tdClass = "tree";
  return (
    <tr className="item">
      <td className={tdClass}>
        <div>
          <MultiParserWithFacets>{post.record}</MultiParserWithFacets>
        </div>
        {post.embed ? (
          <div className="embed">
            <EmbedImageOrVideo embed={post.embed} cid={post.cid} />
            {post.embed.$type === "app.bsky.embed.record#view" ? (
              post.embed.record.$type === "app.bsky.embed.record#viewRecord" ? (
                <a
                  href={ATUriToBskyFeedUrl(post.embed.record.uri)}
                  target="_blank"
                  className="feedView"
                >
                  {post.author.did !== post.embed.record.author.did ? (
                    <img
                      src={post.embed.record.author.avatar}
                      alt={post.embed.record.author.handle}
                      className="icon"
                    />
                  ) : null}
                  <EmbedImageOrVideo
                    embed={post.embed.record.embeds}
                    cid={post.cid}
                  />
                  <MultiParserWithFacets className="content">
                    {post.embed.record.value}
                  </MultiParserWithFacets>
                </a>
              ) : (
                <a
                  href={ATUriToBskyFeedUrl(post.embed.record.uri)}
                  target="_blank"
                  className="feedView"
                >
                  <img
                    src={post.embed.record.avatar}
                    alt={post.embed.record.description}
                    className="icon"
                  />
                  <div className="content">
                    <h4>{post.embed.record.displayName}</h4>
                    <p>{post.embed.record.description}</p>
                  </div>
                </a>
              )
            ) : null}
          </div>
        ) : null}
        <div className="time">
          {post.reason?.$type === "app.bsky.feed.defs#reasonRepost" ? (
            <BiRepost className="repost" />
          ) : null}
          {post.reason?.$type === "app.bsky.feed.defs#reasonPin" ? (
            <BiPin className="pin" />
          ) : null}
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
  const Play = useCallback(
    (callback?: (e: hlsEvents.MANIFEST_PARSED) => void) => {
      if (Hls.isSupported()) {
        const videoRef = ref.current!;
        var hls = new Hls();
        hls.loadSource(video.playlist); // Load the HLS manifest
        hls.attachMedia(videoRef); // Attach to video element
        hls.on(Hls.Events.MANIFEST_PARSED, (e) => {
          videoRef.play();
          if (callback) callback(e);
        });
      } else {
        toast("hls.js is not support.");
      }
    },
    [video],
  );
  let startTime: number = 0;
  let x: number = 0;
  let y: number = 0;
  return (
    <video
      ref={ref}
      loop
      controls
      width={video.aspectRatio.width}
      height={video.aspectRatio.height}
      poster={video.thumbnail}
      onClick={(e) => {
        if (!ref.current?.src) Play();
      }}
      onTouchStart={(e) => {
        if (!ref.current?.src) {
          startTime = e.timeStamp;
          x = e.touches[0].clientX;
          y = e.touches[0].clientY;
        }
      }}
      onTouchEnd={(e) => {
        if (!ref.current?.src) {
          const duration = e.timeStamp - startTime;
          if (duration < 200) {
            const dx = e.changedTouches[0].clientX - x;
            const dy = e.changedTouches[0].clientY - y;
            if (dx < 4 && dy < 4) Play();
          }
        }
      }}
      {...props}
    />
  );
}
