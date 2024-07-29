import { writeFileSync, mkdirSync } from "fs"

type optionsType = {dir?: string, space?: number};

export const dataJsonDir = "./public/json/"

export function exportJsonOut(name: string, obj: any, { dir = dataJsonDir, space }: optionsType = {}) {
  try { mkdirSync(dir, { recursive: true }) } catch { }
  writeFileSync(dir + "/" + name + ".json", JSON.stringify(obj, null, space))
}

export const dataImportDir = "./src/data/import/"

export function exportTsOut(name: string, obj: any, { dir = dataImportDir, space }: optionsType = {}) {
  try { mkdirSync(dir, { recursive: true }) } catch { }
  writeFileSync(dir + "/" + name + ".ts", "export var " + name + ": any = " + JSON.stringify(obj))
}
