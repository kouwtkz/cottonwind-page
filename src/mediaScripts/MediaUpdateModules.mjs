// @ts-check

import { configDotenv } from 'dotenv'
configDotenv();

import { writeFileSync, mkdirSync } from "fs"

const JsonDataDir = "./public/static/data/"
/**
 * @param {string} name
 * @param {any} obj
 */
export function exportJsonOut(name, obj, dir = JsonDataDir) {
  try { mkdirSync(dir, { recursive: true }) } catch { }
  writeFileSync(dir + "/" + name + ".json", JSON.stringify(obj))
}

const ExportDataDir = "./src/data/import/"
/**
 * @param {string} name
 * @param {any} obj 
 */
export function exportTsOut(name, obj, dir = ExportDataDir) {
  try { mkdirSync(dir, { recursive: true }) } catch { }
  writeFileSync(dir + "/" + name + ".ts", "export var " + name + ": any = " + JSON.stringify(obj))
}
