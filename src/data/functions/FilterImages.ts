import { filterGalleryMonthList } from "@/components/dropdown/SortFilterTags";
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

const monthlyFilter = filterGalleryMonthList.find((item) => item.month === currentMonth);

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
