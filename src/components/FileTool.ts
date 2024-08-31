export function fileDialog(
  accept: string = '*',
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

export function fileDownload(name: string, content: BlobPart | BlobPart[]) {
  const blobParts = Array.isArray(content) ? content : [content];
  const blob = new Blob(blobParts, { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = name;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}