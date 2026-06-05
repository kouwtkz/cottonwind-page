export function arrayPartition<T = unknown>(array: T[], partition: number) {
  return Array(Math.ceil(array.length / partition))
    .fill(null)
    .map((_, i) => array.slice(i * partition, (i + 1) * partition))
}

export function getCountList<T>(list: T[], field?: keyof T) {
  return (list as any[])
    .reduce<ValueCountType[]>((list, values) => {
      if (typeof values === "object" && field) {
        values = values[field];
      }
      if (!Array.isArray(values) && values !== null && typeof values !== "undefined") {
        values = [values];
      }
      values?.forEach((value: any) => {
        if (value) {
          const item = list.find((item: any) => item.value === value);
          if (item) item.count++;
          else list.push({ value, count: 1 });
        }
      })
      return list;
    }, [])
    .sort((a, b) => (a.value > b.value ? 1 : -1));
}

export function shuffleArray<T>(array: T[], clone = false) {
  const useArray = clone ? [...array] : array;
  for (let i = useArray.length - 1; i >= 0; i--) {
    let rand = Math.floor(Math.random() * (i + 1))
    let tmpStorage = useArray[i]
    useArray[i] = useArray[rand]
    useArray[rand] = tmpStorage
  }
  return useArray;
}

interface compareArrayOptionsType<T> {
  type?: "nomal";
  key?: keyof T;
}
export function compareArray<T>(array1: T[], array2: T[], { type = "nomal", key }: compareArrayOptionsType<T> = {}) {
  switch (type) {
    case "nomal":
      return array1.length === array2.length && array1.every(v1 => key ? array2.some(v2 => v1[key] === v2[key]) : array2.some(v2 => v1 === v2));
  }
}

export async function asyncFilter<T>(array: T[], filter: (v: T) => Promise<boolean>) {
  const results = await Promise.all(array.map(filter));
  return array.filter((v, i) => results[i]);
}