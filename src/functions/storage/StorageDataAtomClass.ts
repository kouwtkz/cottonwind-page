import { atom, PrimitiveAtom } from "jotai";
import { StorageDataClass } from "./StorageDataClass";

interface StorageDataAtomClassProps {
  src: string;
  key: string;
  version?: string;
  preLoad?: LoadAtomType;
}
export class StorageDataAtomClass<T extends Object = {}> {
  storage: StorageDataClass<T[]>;
  src: string;
  dataAtom = atom<T[]>();
  loadAtom: PrimitiveAtom<LoadAtomType | undefined>;
  constructor({ src, key, version, preLoad }: StorageDataAtomClassProps) {
    this.storage = new StorageDataClass(key, version);
    this.src = src;
    this.loadAtom = atom(preLoad);
  }
}
