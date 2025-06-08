interface LaymicOptions {
  // ページ横幅
  pageWidth?: number,
  // ページの縦幅
  pageHeight?: number,
  // 左から右へと流れる形式で初期化する
  isLTR?: boolean,
  // 戻る進むボタンを表示する
  isVisiblePagination?: boolean,
  // 横読み時一ページ目を空白として空ける
  // 表紙ページを単独表示することを想定
  isFirstSlideEmpty?: boolean,
  // 全ページ数が奇数でいて見開き2p表示の場合
  // 最終ページとして空白ページを追加する
  // optionとして`false`を指定すると無効化できる
  isAppendEmptySlide?: boolean,
  // アイコンを別のものに変更する
  icons?: Partial<LaymicViewerIcons>,
  // 各種クラス名を別のものに変更する
  classNames?: Partial<LaymicClassNames>,
  // ステート変化用クラス名を別のものに変更する
  stateNames?: Partial<LaymicStateClassNames>,
  // 縦読み時のページ間余白ピクセル数値
  vertPageMargin?: number,
  // 横読み時のページ間余白ピクセル数値
  horizPageMargin?: number,
  // 漫画ページ表示コンテナ周囲の余白ピクセル数値
  viewerPadding?: number,
  // 進捗バーの太さ
  progressBarWidth?: LaymicBarWidth,
  // ページ読み込み直後にビューワーを開く機能
  // trueならば有効化、falseならば無効化
  isInstantOpen?: boolean,
  // 漫画を読み進める方向のデフォルト値
  // ユーザー設定がなされていればそちらを優先
  viewerDirection?: "vertical" | "horizontal",
  // インスタンスと紐付けられる文字列
  viewerId?: string,
}

type LaymicViewerPages = (string | Element)[];
interface LaymicPages {
  pages: LaymicViewerPages,
  thumbs: string[],
}

interface LaymicApplicatorOptions {
  // .laymic_template
  templateSelector: string,
  // .laymic_opener
  openerSelector: string,
  // laymic
  defaultViewerId: string
}

interface LaymicViewerElements {
  rootEl: HTMLElement,
  swiperEl: HTMLElement,
  buttons: LaymicViewerUIButtons,
  controllerEl: HTMLElement,
}

// mangaViewer内部で用いるステートまとめ
interface LaymicViewerStates {
  // インスタンス識別に用いる文字列
  viewerId: string,
  // インスタンスごとに固有の数字
  viewerIdx: number,
  viewerPadding: number,
  pageSize: PageSize,
  pageAspect: PageSize,
  thresholdWidth: number,
  rootRect: PageRect,
  isLTR: boolean,
  isVertView: boolean,
  isFirstSlideEmpty: boolean,
  // スマホ横持ち時強制2p表示を無効化するか否か
  isDisabledForceHorizView: boolean,
  // 全ページ数が奇数でいて見開き2p表示の場合
  // 最終ページとして空白ページを追加する
  isAppendEmptySlide: boolean,
  horizPageMargin: number,
  vertPageMargin: number,
  progressBarWidth: number,
  thumbItemHeight: number,
  thumbItemWidth: number,
  thumbItemGap: number,
  thumbsWrapperPadding: number,
  isMobile: boolean,
  isInstantOpen: boolean,
  // スクロール状況を復帰させるためのバッファ
  bodyScrollTop: number,
  // laymicがアクティブ状態ならばtrue
  isActive: boolean,
}
interface LaymicStates extends LaymicViewerStates { }

interface LaymicStateClassNames {
  // 汎用的なアクティブ時ステート
  active: string,
  // 汎用的な非表示時ステート
  hidden: string,
  // 汎用的な反転時ステート
  reversed: string,
  // 横読み時1p表示がなされている際に付与
  singleSlide: string,
  // 設定画面展開中に付与
  showPreference: string,
  // サムネイル表示展開中に付与
  showThumbs: string,
  // ヘルプ表示展開中に付与
  showHelp: string,
  // 全画面表示時に付与
  fullscreen: string,
  // 使用ブラウザがFullscreen APIに未対応の場合に付与
  unsupportedFullscreen: string,
  // UI表示がなされている場合に付与
  visibleUI: string,
  // ページ送りボタン表示設定が有効な場合に付与
  visiblePagination: string,
  // 縦読み時に付与
  vertView: string,
  // 設定が有効な場合に付与
  ltr: string,
  // モバイル端末の場合に付与
  mobile: string,
  // ズーム中に付与
  zoomed: string,
}

type LaymicUIButtonClassNames = Record<keyof LaymicViewerUIButtons, string>

interface LaymicSVGClassNames {
  container: string,
  icon: string,
  defaultProp: string,
}

interface LaymicControllerClassNames {
  controller: string,
  controllerTop: string,
  controllerBottom: string,
}

interface LaymicThumbsClassNames {
  container: string,
  wrapper: string,
  item: string,
  imgThumb: string,
  slideThumb: string,
  lazyload: string,
  lazyloading: string,
  lazyloaded: string,
}

type LaymicPreferenceItemClassNames = Omit<Record<keyof LaymicPreferenceData, string>, "progressBarWidth">

interface LaymicPreferenceClassNames extends LaymicPreferenceItemClassNames {
  container: string,
  wrapper: string,
  notice: string,
  button: string,
}

interface LaymicHelpClassNames {
  container: string,
  wrapper: string,
  vertImg: string,
  horizImg: string,
  innerWrapper: string,
  innerItem: string,
  iconWrapper: string,
  iconLabel: string,
  chevronsContainer: string,
  zoomItem: string,
  fullscreenItem: string,
}

interface LaymicZoomClassNames {
  controller: string,
  wrapper: string
}

interface LaymicClassNames {
  root: string,
  slider: string,
  emptySlide: string,
  uiButton: string,
  pagination: string,
  controller: LaymicControllerClassNames,
  buttons: LaymicUIButtonClassNames,
  svg: LaymicSVGClassNames,
  checkbox: CheckboxClassNames,
  select: SelectClassNames,
  thumbs: LaymicThumbsClassNames,
  preference: LaymicPreferenceClassNames,
  help: LaymicHelpClassNames,
  zoom: LaymicZoomClassNames,
}

interface LaymicPreferenceCheckboxsData {
  // 自動的に全画面化するかの設定値
  isAutoFullscreen: boolean,
  // タップでのページ送りを停止させるかの設定値
  isDisabledTapSlidePage: boolean,
  // スマホを横持ちした際の強制的2p表示を無効化する設定値
  isDisabledForceHorizView: boolean,
  // スマホにおいてズーム中タップでのズーム解除を無効化する設定値
  isDisabledDoubleTapResetZoom: boolean,
}

interface LaymicPreferenceSelectsData {
  // 進捗バーの太さ設定値
  progressBarWidth: LaymicBarWidth,
  // ページ送りボタンの表示設定値
  paginationVisibility: LaymicUIVisibility
  // PC表示での固定ズーム倍率設定値
  zoomButtonRatio: number,
}

type LaymicPreferenceData = LaymicPreferenceCheckboxsData & LaymicPreferenceSelectsData;

type LaymicPreferenceCheckboxs = Record<keyof LaymicPreferenceCheckboxsData, SimpleCheckbox>;
type LaymicPreferenceSelects = Record<keyof LaymicPreferenceSelectsData, SimpleSelect>;

type LaymicPreferenceChoices = LaymicPreferenceCheckboxs & LaymicPreferenceSelects;

type LaymicPreferenceUpdateEventString = keyof LaymicPreferenceData | "";

type LaymicBarWidth = "auto" | "none" | "tint" | "medium" | "bold";

type LaymicUIVisibility = "auto" | "visible" | "hidden";

// mangaViewerで用いるアイコンデータ
// 最低限のsvg生成に必要な内容だけ格納
interface LaymicIconData {
  id: string,
  className: string,
  viewBox: string,
  pathDs: string[],
}

// mangaViewerで用いるアイコンまとめ
interface LaymicViewerIcons {
  close: LaymicIconData,
  fullscreen: LaymicIconData,
  exitFullscreen: LaymicIconData,
  preference: LaymicIconData,
  showThumbs: LaymicIconData,
  vertView: LaymicIconData,
  horizView: LaymicIconData,
  checkboxOuter: LaymicIconData,
  checkboxInner: LaymicIconData,
  showHelp: LaymicIconData,
  zoomIn: LaymicIconData,
  viewerDirection: LaymicIconData,
  touchApp: LaymicIconData,
  // ページ送り方向を示唆するアイコン
  // 左向きだけ用意して、後はcssで回転させて用いる
  chevronLeft: LaymicIconData
}

// mangaViewer UI要素として組み込むボタン要素まとめ
interface LaymicViewerUIButtons {
  help: HTMLButtonElement,
  close: HTMLButtonElement,
  fullscreen: HTMLButtonElement,
  preference: HTMLButtonElement,
  // show thumbs button
  thumbs: HTMLButtonElement,
  // direction change button
  direction: HTMLButtonElement,
  nextPage: HTMLButtonElement,
  prevPage: HTMLButtonElement,
  zoom: HTMLButtonElement
  progressbar: HTMLDivElement,
}

interface LaymicDOMBuilder {
  classNames: LaymicClassNames;
  icons: LaymicViewerIcons;
  stateNames: LaymicStateClassNames;
}

interface LaymicPreference {
  private PREFERENCE_KEY: "laymic_preferenceData";
  readonly rootEl: HTMLElement;
  readonly el: HTMLElement;
  readonly wrapperEl: HTMLElement;
  readonly choices: LaymicPreferenceChoices;
  readonly builder: LaymicDOMBuilder;
}

interface LaymicCSSVariables {
  readonly el: LaymicViewerElements;
  readonly state: LaymicStates;
}

interface LaymicHelp {
  private readonly ISDISPLAYED_KEY: "laymic_isHelpDisplayed";
  readonly rootEl: HTMLElement;
  // help el
  readonly el: HTMLElement;
  // help wrapper el
  readonly wrapperEl: HTMLElement;
  readonly builder: LaymicDOMBuilder;
  // 表示中か否かを判別するbool
  private _isActive: boolean;
  // 表示済みか否かを判別するbool
  private _isDisplayed: boolean;
}

interface LaymicZoomStates {
  // 現在のズーム倍率
  zoomRatio: number,
  // 最小ズーム倍率
  minRatio: number,
  // 最大ズーム倍率
  maxRatio: number,
  // スワイプ/ドラッグ判定
  isSwiped: boolean,
  // マウス操作時のマウス押下判定
  isMouseDown: boolean,
  // 過去のx座標
  pastX: number,
  // 過去のy座標
  pastY: number,
  // zoomController要素のサイズ
  zoomRect: PageRect,
  // pinch past distance
  pastDistance: number,
}

interface LaymicZoom {
  readonly rootEl: HTMLElement;
  readonly wrapper: HTMLElement;
  readonly controller: HTMLElement;
  readonly builder: LaymicDOMBuilder;
  readonly preference: LaymicPreference
  readonly state: LaymicZoomStates;
}

interface LaymicSlider {
  // 現在のviewType文字列
  viewType: SwiperViewType = "horizontal2p";
  swiper: Swiper;
  readonly el: LaymicViewerElements;
  readonly state: LaymicStates;
  readonly builder: LaymicDOMBuilder;
  readonly preference: LaymicPreference;
  readonly zoom: LaymicZoom;
  private _isViewerUIActive: boolean;
}

interface LaymicThumbnails {
  private _isActive: false;
  readonly state: LaymicStates;
  readonly builder: LaymicDOMBuilder;
  readonly rootEl: HTMLElement;
  readonly el: HTMLElement;
  readonly wrapperEl: HTMLElement;
  readonly thumbEls: Element[];
  readonly thumbButtons: HTMLButtonElement[];
}

class Laymic {
  constructor(pages: LaymicPages, options?: LaymicOptions);
  open(isDisableFullscreen?: boolean): void;
  close(): void;
  el: LaymicViewerElements;
  state: LaymicStates;
  initOptions: LaymicOptions;
  preference: LaymicPreference;
  thumbs: LaymicThumbnails;
  help: LaymicHelp;
  zoom: LaymicZoomStates;
  cssVar: LaymicCSSVariables;
  slider: LaymicSlider;
  builder: LaymicDOMBuilder;
}
class LaymicApplicator {
  constructor(applicationOptions: string | LaymicApplicatorOptions, options: LaymicOptions);
  open(viewerId: string);
  close(viewerId: string);
}

declare const laymic = {
  Laymic: Laymic,
  LaymicApplicator: LaymicApplicator
}
