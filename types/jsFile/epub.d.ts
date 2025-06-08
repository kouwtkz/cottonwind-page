declare function ePub(
  urlOrData: string | ArrayBuffer,
  options?: BookOptions
): ePubBook;
declare function ePub(options?: BookOptions): ePubBook;
type ePubDirection = "rtl" | "ltr";
interface ePubDataSetting {
  direction: ePubDirection;
  flow: "auto" | string;
  layout: string;
  minSpreadWidth: number;
  orientation: string;
  spread: "landscape" | string;
  viewport: string;
}
interface ePubMetadataType {
  creator: string;
  description: string;
  direction: ePubDirection;
  flow: string;
  identifier: string;
  language: string;
  layout: string;
  media_active_class: string;
  modified_date: string;
  orientation: string;
  pubdate: string;
  publisher: string;
  rights: string;
  spread: "landscape" | string;
  title: string;
  viewport: string;
}
interface ePubDisplayOptions {
  interactive: string;
  fixedLayout: string;
  openToSpread: string;
  orientationLock: string;
}
interface ePubPageTocItem {
  href: string;
  id: string;
  label: string;
  parent?: any;
}
interface ePubNavigation {
  landmarks: any[];
  landmarksByType: Object;
  length: number;
  toc: ePubPageTocItem[];
  tocByHref: { [k: string]: number };
  tocById: { [k: string]: number };
}
interface ePubResourceAssets {
  href: string;
  overlay: string;
  properties: string[];
  type: string;
}

interface ePubCfi {
  base: Object;
  end: any;
  path: Object;
  range: boolean;
  spinePos: number;
  start: any;
  str: string;
}

interface ePubSpineItem {
  canonical: string;
  cfiBase: string;
  href: string;
  idref: string;
  index: number;
  linear: string;
  next: Function;
  prev: Function;
  properties: string[];
  url: string;
  contents?: any;
  document?: any;
  hooks: { serialize: any; content: any };
  output?: any;
}

type ePubManifestType = ePubResourceAssets & {
  [k: string]: ePubResourceAssets;
};

interface ePubSpine {
  baseUrl: string;
  epubcfi: ePubCfi;
  hooks: { serialize: any; content: any };
  items: ePubSpineItem[];
  length: number;
  loaded: boolean;
  manifest: ePubManifestType;
  spineByHref: { [k: string]: number };
  spineById: { [k: string]: number };
  spineItems: ePubSpineItem[];
  spineNodeIndex: number;
}
interface ePubLocations {
  break: number;
  epubcfi: ePubCfi;
  pause: number;
  processingTimeout?: number;
  q: any;
  request: Function;
  spine: ePubSpine;
  total: number;
  _current: number;
  _currentCfi: string;
  _locations: string[];
  _locationsWords: string[];
  _wordCounter: number;
  currentLocation: number;
}
interface ePubResources {
  assets: ePubResourceAssets[];
  css: ePubResourceAssets[];
  cssUrls: string[];
  html: ePubResourceAssets[];
  manifest: { [k: string]: ePubResourceAssets };
  replacementUrls: string[];
  resources: ePubResourceAssets[];
  settings: {
    replacements: string;
    archive: ePubArchive;
    resolver: ƒ;
    request: ƒ;
  };
  urls: string[];
  get(href: string): Promise<string>;
}
interface ePubOpeningItem {
  id: string;
  promise: Promise<H>;
  reject: Function;
  resolve: Function;
}
interface ePubArchive {
  zip: { files: File; comment: null; root: string; clone: Function };
  urlCache: any[];
}
interface ePubContainer {
  packagePath: string;
  directory: string;
  encoding: string;
}
interface ePubNavigation {
  landmarks: any[];
  landmarksByType: string[];
  length: number;
  toc: ePubPageTocItem[];
  tocByHref: { [k: string]: number };
  tocById: { [k: string]: number };
}
interface ePubPackage {
  coverPath: string;
  manifest: ePubManifestType;
  metadata: ePubMetadataType;
  navPath: string;
  ncxPath: boolean;
  spine: ePubSpineItem[];
  spineNodeIndex: number;
  uniqueIdentifier: string;
}
interface ePubPathType {
  directory: string;
  extension: string;
  filename: string;
  path: string;
}
interface ePubPageList {
  epubcfi: ePubCfi;
  firstPage: number;
  lastPage: number;
  locations: string[];
  ncx?: any;
  pageList: any[];
  pages: any[];
  toc?: ePubPageTocItem[];
  totalPages: number;
}
interface ePubView {
  columnWidth: string;
  delta: number;
  divisor: number;
  gap: number;
  height: number;
  name: string;
  props: {
    columnWidth: number;
    delta: number;
    divisor: number;
    flow: string;
    gap: number;
    height: number;
    name: string;
    spread: boolean;
    spreadWidth: number;
    width: number;
  };
  settings: {
    layout: string;
    spread: string;
    orientation: string;
    flow: string;
    viewport: string;
  };
  spreadWidth: number;
  width: number;
  _evenSpreads: boolean;
  _flow: string;
  _minSpreadWidth: number;
  _spread: boolean;
}
interface ePubBook {
  archive: ePubArchive;
  archived: boolean;
  container: ePubContainer;
  cover: string;
  displayOptions: ePubDisplayOptions;
  isOpen: boolean;
  isRendered: boolean;
  loaded: {
    cover: Promise<string>;
    displayOptions: Promise<ePubDisplayOptions>;
    manifest: Promise<Object>;
    metadata: Promise<Object>;
    navigation: Promise<ePubNavigation>;
    pageList: Promise<any[] | undefined>;
    resources: Promise<ePubResources>;
    spine: Promise<ePubSpine>;
  };
  loading: {
    cover: ePubOpeningItem;
    displayOptions: ePubOpeningItem;
    manifest: ePubOpeningItem;
    metadata: ePubOpeningItem;
    spine: ePubOpeningItem;
    navigation: ePubOpeningItem;
    pageList: ePubOpeningItem;
    resources: ePubOpeningItem;
    spine: ePubOpeningItem;
  };
  locations: ePubLocations;
  navigation: ePubNavigation;
  opened: Promise<ePubBook>;
  opening: ePubOpeningItem;
  package: ePubPackage;
  packaging: ePubPackage;
  pageList: ePubPageList;
  path: ePubPathType;
  ready: Promise<any[]>;
  rendition: ePubRendition;
  request(t: any, e: any, i: any, n: any): any;
  resources: ePubResources;
  settings: any;
  spine: ePubSpine;
  storage: any;
  url: URL;
  renderTo(
    elm: HTMLElement,
    options?: { w?: number; h?: number }
  ): ePubRendition;
}
interface ePubRendition {
  book: ePubBook;
  epubcfi: ePubCfi;
  starting: ePubOpeningItem;
  View: ePubView;
  ViewManager: ePubSpine;
  themes: {
    rendition: ePubRendition;
    _current: string;
    _injected: any[];
    _overrides: any;
    _themes: {
      [k: string]: { rules: Object; url: string; serialized: string };
    };
  };
  display(): Promise;
}
