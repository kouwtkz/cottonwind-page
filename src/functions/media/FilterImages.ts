import { defaultGalleryTags, filterGalleryMonthList } from "@/components/dropdown/SortFilterTags";
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

export function getTimeframeTag(date = new Date()): TimeframeTagType {
  const hours = date.getHours();
  if (6 <= hours && hours < 9) return "morning";
  if (9 <= hours && hours < 12) return "forenoon";
  if (12 <= hours && hours < 14) return "midday";
  if (14 <= hours && hours < 16) return "afternoon";
  if (17 <= hours && hours < 20) return "evening";
  if (20 <= hours && hours < 24) return "night";
  else return "midnight"
}

interface filterPickFixedProps {
  images: ImageType[];
  name: "topImage" | "pickup";
  monthly?: boolean;
}

export function filterPickFixed({ images, name: kind, monthly = true }: filterPickFixedProps) {
  return images.filter(
    (image) =>
      image[kind] ||
      (monthly && monthlyFilter && image[kind] !== false
        && filterTags({ image, tags: monthlyFilter.tags, every: false }))
  )
}
