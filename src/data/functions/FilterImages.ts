import { filterMonthList } from "../../components/tag/GalleryTags";
export const publicParam = { list: <Array<MediaImageItemType>>[] };
const currentTime = new Date();
const currentMonth = currentTime.getMonth() + 1;

interface filterTagsBaseProps {
  every?: boolean;
  tags: string[];
}

interface filterTagsProps extends filterTagsBaseProps {
  image: MediaImageItemType;
}

export function filterTags({ image, every = true, tags }: filterTagsProps) {
  return image.tags?.some((tag) =>
    every ? tags.every((mtag) => mtag === tag) : tags.some((mtag) => mtag === tag)
  )
}

interface filterImagesTagsProps extends filterTagsBaseProps {
  images: MediaImageItemType[];
}

export function filterImagesTags({ images, ...args }: filterImagesTagsProps) {
  return images.filter(
    (image) =>
      filterTags({ image, ...args })
  )
}

const monthlyFilter = filterMonthList.find((item) => item.month === currentMonth);

interface filterPickFixedProps {
  images: MediaImageItemType[];
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
