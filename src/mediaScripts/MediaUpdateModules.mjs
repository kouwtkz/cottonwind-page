// @ts-check

import { configDotenv } from 'dotenv'
configDotenv();

import { writeFileSync, mkdirSync } from "fs"

const JsonDataDir = "./public/static/data/"
try { mkdirSync(JsonDataDir, { recursive: true }) } catch { }
/**
 * @param {string} name
 * @param {any} obj
 */
export function exportJsonOut(name, obj) {
  writeFileSync(JsonDataDir + name + ".json", JSON.stringify(obj))
}

const ExportDataDir = "./src/data/import/"
try { mkdirSync(ExportDataDir, { recursive: true }) } catch { }
/**
 * @param {string} name
 * @param {any} obj 
 */
export function exportTsOut(name, obj) {
  writeFileSync(ExportDataDir + name + ".ts", "export var " + name + ": any = " + JSON.stringify(obj))
}
