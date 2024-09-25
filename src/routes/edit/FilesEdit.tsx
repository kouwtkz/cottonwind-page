import { PromiseOrder } from "@/functions/arrayFunction";
import { corsFetch } from "@/functions/fetch";
import { UploadToast } from "@/state/DataState";

export async function FilesUploadProcess({
  files,
  apiOrigin,
  path,
  sleepTime = 10,
  minTime,
}: FilesUploadProps) {
  const url = (apiOrigin || "") + path;
  const formDataList = files.map((file) => {
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  });
  const fetchList = formDataList.map(
    (body) => () => corsFetch(url, { method: "POST", body })
  );
  const results = await PromiseOrder(fetchList, { sleepTime, minTime });
  const successCount = results.filter((r) => r.status === 200).length;
  if (results.length === successCount) {
    return {
      message: successCount + "件のアップロードに成功しました！",
      results,
    };
  } else {
    console.error("以下のアップロードに失敗しました");
    const failedList = results
      .filter((r) => r.status !== 200)
      .map((_, i) => formDataList[i])
      .map((formData) => {
        const file = formData.get("file") as File;
        const name = file.name;
        console.error(name);
        return name;
      });
    throw {
      message:
        (successCount
          ? successCount + "件のアップロードに成功しましたが、"
          : "") +
        failedList.length +
        "件のアップロードに失敗しました\n" +
        failedList.join("\n"),
      results,
    };
  }
}

export async function FilesUpload(args: FilesUploadProps) {
  return UploadToast(FilesUploadProcess(args));
}
