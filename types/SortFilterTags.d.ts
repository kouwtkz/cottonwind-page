interface ContentsTagsOption {
  name?: string;
  label?: string;
  color?: string;
  value?: string;
  index?: number;
  group?: string;
  count?: number;
  editable?: boolean;
  nameGuide?: string | string[];
  query?: { [k: string]: string };
  tag?: valueCountType;
  options?: ContentsTagsOption[];
  rawValue?: string;
}
interface ContentsTagsOptionMustLabel extends ContentsTagsOption {
  label: string;
}
interface ContentsTagsOptionMustValue extends ContentsTagsOption {
  value: string;
}
interface ContentsTagsOptionMustLabelValue extends ContentsTagsOption {
  label: string;
  value: string;
}
interface ContentsTagsOptionTimeframe extends ContentsTagsOptionMustLabelValue {
  during: string;
}
