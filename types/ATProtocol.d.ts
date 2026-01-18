interface ATProtoStateType {
  handle?: string;
  did?: string;
  didInfo?: didInfoType | null;
  describe?: ATDescribeType | null;
  endpoint?: string;
  linkat?: Array<LinkatType>;
  posts?: Array<BlueskyFeedPostRawType>;
  _getPostProps?: BlueskyFeedGetPostProps;
  GetPosts(props?: BlueskyFeedGetPostProps): void;
}

interface BlueskyFeedGetPostProps {
  limit?: number;
  cursor?: string;
  filter?: "posts_with_replies" | "posts_no_replies" | "posts_with_media" | "posts_and_author_threads" | "posts_with_video";
  pin?: boolean;
}

interface ATServiceType {
  id: string;
  type: string;
  serviceEndpoint: string;
}

interface didInfoType {
  "@context": Array<string>;
  id: string;
  alsoKnownAs: Array<string>;
  verificationMethod:
  Array<
    {
      id: string;
      type: string;
      controller: string;
      publicKeyMultibase: string;
    }
  >;
  service:
  Array<ATServiceType>
}

interface ATDescribeType {
  collections: Array<string>;
  did: string;
  didDoc: { "@context": Array<string>, id: string, alsoKnownAs: Array<string>, verificationMethod: Array<string>, service: Array<ATServiceType> }
  handle: string;
  handleIsCorrect: boolean;
}

interface ATListRecordType<T> {
  cursor: string;
  records: Array<{
    cid: string;
    uri: string;
    value: T;
  }>;
}

interface LinkatType {
  emoji: string;
  text: string;
  url: string;
}

interface ATBaseType<T extends string = string> {
  "$type": T;
}

interface LinkatRecordType extends ATBaseType<"blue.linkat.board"> {
  cards: Array<LinkatType>
}
interface BlueskyEmbedBlobType<T extends string = string> {
  $type: "blob";
  mimeType: T;
  ref: {
    $link: string;
  }
  size: number;
}
interface BlueskyFeedPostEmbedImageViewItemType {
  alt: string;
  aspectRatio: { width: number; height: number };
  fullsize: string;
  thumb: string;
}
interface BlueskyFeedPostEmbedImageViewType extends ATBaseType<"app.bsky.embed.images#view"> {
  images: Array<BlueskyFeedPostEmbedImageViewItemType>;
}
interface BlueskyFeedPostEmbedVideoViewType extends ATBaseType<"app.bsky.embed.video#view"> {
  aspectRatio: { width: number; height: number };
  cid: string;
  playlist: string;
  thumbnail: string;
}
interface BlueskyFeedPostEmbedImageType extends ATBaseType<"app.bsky.embed.images"> {
  images: [{
    alt: string;
    aspectRatio: { width: number; height: number };
    image: BlueskyEmbedBlobType;
  }];
}
interface BlueskyFeedPostEmbedVideoType extends ATBaseType<"app.bsky.embed.video"> {
  aspectRatio: { width: number; height: number };
  video: BlueskyEmbedBlobType<"video/mp4">;
}
interface CidUriType {
  cid: string;
  uri: string;
}
interface ATFacetLinkType extends ATBaseType<"app.bsky.richtext.facet#link"> {
  uri: string;
}
interface ATFacetMentionType extends ATBaseType<"app.bsky.richtext.facet#mention"> {
  did: string;
}
interface ATFacetTagType extends ATBaseType<"app.bsky.richtext.facet#tag"> {
  tag: string;
}
interface FacetsType {
  index: {
    byteStart: number,
    byteEnd: number
  },
  features: Array<ATUriType | ATFacetMentionType | ATFacetTagType>;
}
interface BlueskyFeedPostRecordType extends ATBaseType<"app.bsky.feed.post"> {
  createdAt: string;
  facets: Array<FacetsType>;
  langs: Array<string>;
  reply?: {
    parent: CidUriType;
    root: CidUriType;
  }
  text: string;
  embed?: BlueskyFeedPostEmbedImageType | BlueskyFeedPostEmbedVideoType;
}

interface BlueskyFeedAuthorType {
  associated: {
    activitySubscription: {
      allowSubscriptions: string;
    }
  };
  chat: {
    allowIncoming: string;
  }
  avatar: string;
  createdAt: string;
  did: string;
  displayName: string;
  handle: string;
  labels: Array;
  pronouns: string;
}

interface BlueskyFeedPostRawType {
  author: BlueskyFeedAuthorType;
  bookmarkCount: 0;
  cid: string;
  embed?: BlueskyFeedPostEmbedImageViewType | BlueskyFeedPostEmbedVideoViewType;
  indexedAt: string;
  labels: Array;
  likeCount: number;
  quoteCount: number;
  record: BlueskyFeedPostRecordType;
  replyCount: number;
  repostCount: number;
  uri: string;
}
interface BlueskyFeedPostReasonRepostType extends ATBaseType<"app.bsky.feed.defs#reasonRepost"> {
  by: BlueskyFeedAuthorType;
  cid: string;
  indexedAt: string;
  uri: string;
}
interface BlueskyFeedPostType extends BlueskyFeedPostRawType {
  reason?: BlueskyFeedPostReasonRepostType;
}

interface BlueskyFeedItemType {
  post: BlueskyFeedPostRawType;
  reply?: {
    parent: CidUriType;
    root: CidUriType;
  }
  reason?: BlueskyFeedPostReasonRepostType;
}

interface BlueskyFeedType {
  cursor: string;
  feed: Array<BlueskyFeedItemType>;
}

interface ATListFeedType<T> {
  cursor: string;
  feed: Array<{
    cid: string;
    uri: string;
    value: T;
  }>;
}
