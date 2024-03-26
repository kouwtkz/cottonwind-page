export interface CopyDirOptions {
  /** @default false */
  identical?: boolean
  /** @default true */
  withDir?: boolean
  /** @default false */
  force?: boolean
  /** @default undefined */
  ignore?: string | RegExp
  /** @default undefined */
  ignoreDir?: string | RegExp
}  
