type BaseMime = 'audio/aac' | 'video/x-msvideo' | 'image/avif' | 'video/av1' | 'application/octet-stream' | 'image/bmp' | 'text/css' | 'text/csv' | 'application/vnd.ms-fontobject' | 'application/epub+zip' | 'image/gif' | 'application/gzip' | 'text/html' | 'image/x-icon' | 'text/calendar' | 'image/jpeg' | 'text/javascript' | 'application/json' | 'application/ld+json' | 'audio/x-midi' | 'audio/mpeg' | 'video/mp4' | 'video/mpeg' | 'audio/ogg' | 'video/ogg' | 'application/ogg' | 'audio/opus' | 'font/otf' | 'application/pdf' | 'image/png' | 'application/rtf' | 'image/svg+xml' | 'image/tiff' | 'video/mp2t' | 'font/ttf' | 'text/plain' | 'application/wasm' | 'video/webm' | 'audio/webm' | 'image/webp' | 'font/woff' | 'font/woff2' | 'application/xhtml+xml' | 'application/xml' | 'application/zip' | 'video/3gpp' | 'video/3gpp2' | 'model/gltf+json' | 'model/gltf-binary';
export type FileSelectMime = BaseMime | '*' | 'image/*' | 'text/*' | 'video/*' | 'audio/*' | 'model/*';

export function fileDialog(
  accept: FileSelectMime | {} & string = '*',
  multiple: boolean = false
): Promise<FileList> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    input.accept = accept
    input.onchange = () => {
      const { files } = input
      if (files) {
        resolve(files)
      } else {
        reject(Error('Not receive the FileList'))
      }
      input.remove()
    }
    input.click()
  })
}

export async function jsonFileDialog<T = any>() {
  return fileDialog('application/json')
    .then((files) => files.item(0)?.arrayBuffer())
    .then((buf) => new TextDecoder().decode(buf))
    .then((result) => JSON.parse(result) as T);
}

export function fileDownload(name: string, content: BlobPart | BlobPart[]) {
  const blobParts = Array.isArray(content) ? content : [content];
  const blob = new Blob(blobParts, { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = name;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function responseToFile(res: Response, filename: string) {
  return res
  .blob()
    .then(blob => ({
      contentType: res.headers.get("Content-Type"),
      blob: blob
    }))
    .then(data => {
      return new File([data.blob], filename, { type: data.contentType || undefined });
    })
}