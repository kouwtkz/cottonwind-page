import { defaultGalleryTags, filterGalleryMonthList } from "~/components/dropdown/SortFilterTags";
export const publicParam = { list: <Array<OldMediaImageItemType>>[] };
const currentTime = new Date();
const currentMonth = currentTime.getMonth() + 1;

interface filterTagsBaseProps {
  every?: boolean;
  tags: string[];
}

interface filterTagsProps extends filterTagsBaseProps {
  image: ImageType;
}

export function filterTags({ image, every = true, tags }: filterTagsProps) {
  return image.tags?.some((tag) =>
    every ? tags.every((mtag) => mtag === tag) : tags.some((mtag) => mtag === tag)
  )
}

interface filterImagesTagsProps extends filterTagsBaseProps {
  images: ImageType[];
}

export function filterImagesTags({ images, ...args }: filterImagesTagsProps) {
  return images.filter(
    (image) =>
      filterTags({ image, ...args })
  )
}

export const monthlyFilter = filterGalleryMonthList.find((item) => item.month === currentMonth);

export function getTimeframeTag(time: Date | number = new Date()): TimeframeTagType {
  const hours = typeof time === "number" ? time : time.getHours();
  if (6 <= hours && hours < 9) return "morning";
  if (9 <= hours && hours < 12) return "forenoon";
  if (12 <= hours && hours < 14) return "midday";
  if (14 <= hours && hours < 17) return "afternoon";
  if (17 <= hours && hours < 20) return "evening";
  if (20 <= hours && hours < 24) return "night";
  else return "midnight"
}

interface filterPickFixedBaseProps {
  name: "topImage" | "pickup";
  monthly?: boolean;
}

interface innerFilterPickFixedProps extends filterPickFixedBaseProps {
  image: ImageType;
}

export function innerFilterPickFixed({ image, name, monthly = true }: innerFilterPickFixedProps) {
  return image[name] ||
    (monthly && monthlyFilter && image[name] !== false
      && filterTags({ image, tags: monthlyFilter.tags, every: false }))
}

interface filterPickFixedProps extends filterPickFixedBaseProps {
  images: ImageType[];
}

export function filterPickFixed({ images, ...props }: filterPickFixedProps) {
  return images.filter(
    (image) => innerFilterPickFixed({ image, ...props })
  )
}
