type TimeframeTagType = "morning" | "forenoon" | "midday" | "afternoon" | "evening" | "night" | "midnight";

type defineSortTagsUnion =
  | "recently"
  | "leastRecently"
  | "nameOrder"
  | "leastNameOrder"
  | "creationTimeOrder"
  | "shortnessCreationTimeOrder"
  | "likeCount"
  | "mix"
  | "total";
