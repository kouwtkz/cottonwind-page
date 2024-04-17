// @ts-check

import { writeFileSync, mkdirSync } from "fs"

export const dataJsonDir = "./public/static/data/"
/**
 * @param {string} name
 * @param {any} obj
 * @param {{dir?: string, space?: number}} args
 */
export function exportJsonOut(name, obj, { dir = dataJsonDir, space } = {}) {
  try { mkdirSync(dir, { recursive: true }) } catch { }
  writeFileSync(dir + "/" + name + ".json", JSON.stringify(obj, null, space))
}

export const dataImportDir = "./src/data/import/"
/**
 * @param {string} name
 * @param {any} obj 
 * @param {{dir?: string, space?: number}} args
 */
export function exportTsOut(name, obj, { dir = dataImportDir, space } = {}) {
  try { mkdirSync(dir, { recursive: true }) } catch { }
  writeFileSync(dir + "/" + name + ".ts", "export var " + name + ": any = " + JSON.stringify(obj))
}
