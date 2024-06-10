import axios from "axios";

export function setCategory(
  {
    selectCategory,
    newCategoryBase
  }: {
    selectCategory: HTMLSelectElement | null,
    newCategoryBase: HTMLOptionElement | null
  }
) {
  if (!selectCategory || !newCategoryBase) return;
  if (selectCategory.value === "new") {
    const answer = prompt("新規カテゴリーを入力してください");
    if (answer === null || answer === "new") {
      selectCategory.value = selectCategory.dataset.before || "";
    } else if (answer && !selectCategory.querySelector(`[value="${answer}"]`)) {
      const newCategoryID = "newCategory";
      let newCategory = selectCategory.querySelector(
        `option#${newCategoryID}`
      ) as HTMLOptionElement;
      if (!newCategory) {
        newCategory = document.createElement("option");
        newCategory.id = newCategoryID;
        newCategoryBase.after(newCategory as any);
      }
      newCategory.value = answer;
      newCategory.innerText = answer;
      selectCategory.value = answer;
    } else {
      selectCategory.value = answer;
    }
  }
  selectCategory.dataset.before = selectCategory.value;
}
type textareaType = {
  textarea: HTMLTextAreaElement | null
}
export function replacePostTextarea({ textarea, before = '', after }: textareaType & { before: string, after?: string }) {
  if (!textarea) return;
  if (after === undefined) after = before;
  const { selectionStart, selectionEnd } = textarea;
  const selection = textarea.value.slice(selectionStart, selectionEnd);
  textarea.setRangeText(`${before}${selection}${after}`, selectionStart, selectionEnd);
  if (selectionStart === selectionEnd) {
    const selectionStartReset = selectionStart + before.length;
    textarea.setSelectionRange(selectionStartReset, selectionStartReset);
  }
  textarea.focus();
}

export function setDecoration(
  {
    selectDecoration,
    textarea,
    colorChanger
  }: textareaType & {
    selectDecoration: HTMLSelectElement | null,
    colorChanger: HTMLInputElement | null
  }
) {
  if (!selectDecoration || !textarea) return;
  switch (selectDecoration.value) {
    case 'color':
      if (colorChanger) colorChanger.click();
      break;
    case 'italic':
      replacePostTextarea({ textarea, before: '*' })
      break;
    case 'bold':
      replacePostTextarea({ textarea, before: '**' })
      break;
    case 'strikethrough':
      replacePostTextarea({ textarea, before: '~~' })
      break;
  }
  selectDecoration.value = '';
}

export function setColorChange(
  {
    textarea,
    colorChanger
  }: textareaType & {
    colorChanger: HTMLInputElement | null
  }
) {
  if (colorChanger && textarea) replacePostTextarea({ textarea, before: `<span style="color:${colorChanger.value}">`, after: '</span>' })
}

export function setPostInsert(
  {
    selectInsert,
    textarea,
  }: textareaType & {
    selectInsert: HTMLSelectElement | null,
  }
) {
  if (!selectInsert || !textarea) return;
  switch (selectInsert.value) {
    case 'br':
      replacePostTextarea({ textarea, before: "\n<br/>\n\n", after: "" })
      break;
    case 'more':
      replacePostTextarea({ textarea, before: "\n<details>\n<summary>もっと読む</summary>\n\n", after: "\n</details>" })
      break;
    case 'h2':
      replacePostTextarea({ textarea, before: '## ', after: '' })
      break;
    case 'h3':
      replacePostTextarea({ textarea, before: '### ', after: '' })
      break;
    case 'h4':
      replacePostTextarea({ textarea, before: '#### ', after: '' })
      break;
    case 'li':
      replacePostTextarea({ textarea, before: '- ', after: '' })
      break;
    case 'ol':
      replacePostTextarea({ textarea, before: '+ ', after: '' })
      break;
    case 'code':
      replacePostTextarea({ textarea, before: "```\n", after: "\n```" })
      break;
  }
  selectInsert.value = '';
}

export function setAttached({ inputAttached, textarea }: textareaType & { inputAttached: HTMLInputElement | null, textarea: HTMLTextAreaElement | null }) {
  if (!inputAttached || !textarea) return;
  const files = inputAttached.files || [];
  Array.from(files).forEach((file) => {
    const filename = file.name;
    const uploadname = filename.replaceAll(' ', '_');
    if (!textarea.value.match(uploadname)) {
      const value = `\n![](?image=${uploadname}&pic)`;
      textarea.setRangeText(value);
      textarea.focus();
    }
  })
  inputAttached.style.display = (files.length === 0) ? 'none' : '';
}

export function setMedia(
  {
    selectMedia,
    inputAttached,
    textarea,
  }: textareaType & {
    selectMedia: HTMLSelectElement | null,
    inputAttached: HTMLInputElement | null,
  }
) {
  if (!selectMedia || !textarea) return;
  switch (selectMedia.value) {
    case 'attached':
      if (inputAttached) {
        if (inputAttached.style.display === 'none') inputAttached.value = '';
        inputAttached.click();
      }
      break;
    case 'upload':
      if (import.meta.env.VITE_UPLOAD_BRACKET) replacePostTextarea({ textarea, before: '![](', after: ')' });
      else textarea.focus();
      window.open(import.meta.env.VITE_UPLOAD_SERVICE, 'upload');
      break;
    case 'gallery':
      window.open('/gallery/', 'gallery', "width=620px,height=720px");
      break;
    case 'link':
      replacePostTextarea({ textarea, before: '[', after: ']()' })
      break;
  }
  selectMedia.value = '';
}

export function setOperation({
  selectOperation,
  onChangePostId,
  onDuplication,
  onDelete,
  jsonUrl,
}: {
  selectOperation: HTMLSelectElement | null,
  onChangePostId: () => void
  onDuplication: () => void
  onDelete: () => void
  jsonUrl: string
}
) {
  if (!selectOperation) return;
  switch (selectOperation.value) {
    case 'postid':
      onChangePostId();
      break;
    case 'duplication':
      onDuplication();
      break;
    case 'delete':
      onDelete();
      break;
    case 'download':
      if (confirm("記事データを一括で取得しますか？")) {
        location.href = jsonUrl + "?dl";
      }
      break;
    case 'upload':
      const uploadFileSelector = document.createElement('input');
      uploadFileSelector.type = "file";
      uploadFileSelector.accept = "application/json"
      uploadFileSelector.onchange = (() => {
        if (uploadFileSelector.files && confirm("記事データを一括で上書きしますか？")) {
          axios.post("/blog/send/all", uploadFileSelector.files[0]).then(() => {
            alert("記事データを上書きしました。");
            location.href = "/blog";
          })
        }
      })
      uploadFileSelector.click();
      break;
  }
  selectOperation.value = '';
}
