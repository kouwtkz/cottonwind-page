// あらかじめスクリプトは外部から取得する形式にする
declare const hljs: {
  highlight(code: string, options: HighlightOptions): HighlightResult
  /** @deprecated use `higlight(code, {lang: ..., ignoreIllegals: ...})` */
  highlight(languageName: string, code: string, ignoreIllegals?: boolean): HighlightResult
  highlightAuto: (code: string, languageSubset?: string[]) => AutoHighlightResult
  highlightBlock: (element: HTMLElement) => void
  highlightElement: (element: HTMLElement) => void
  configure: (options: Partial<HLJSOptions>) => void
  initHighlighting: () => void
  initHighlightingOnLoad: () => void
  highlightAll: () => void
  registerLanguage: (languageName: string, language: LanguageFn) => void
  unregisterLanguage: (languageName: string) => void
  listLanguages: () => string[]
  registerAliases: (aliasList: string | string[], { languageName }: { languageName: string }) => void
  getLanguage: (languageName: string) => Language | undefined
  autoDetection: (languageName: string) => boolean
  inherit: <T>(original: T, ...args: Record<string, any>[]) => T
  addPlugin: (plugin: HLJSPlugin) => void
  removePlugin: (plugin: HLJSPlugin) => void
  debugMode: () => void
  safeMode: () => void
  versionString: string
  vuePlugin: () => VuePlugin
  regex: {
    concat: (...args: (RegExp | string)[]) => string,
    lookahead: (re: RegExp | string) => string,
    either: (...args: (RegExp | string)[] | [...(RegExp | string)[], RegexEitherOptions]) => string,
    optional: (re: RegExp | string) => string,
    anyNumberOfTimes: (re: RegExp | string) => string
  }
  newInstance: () => HLJSApi
}