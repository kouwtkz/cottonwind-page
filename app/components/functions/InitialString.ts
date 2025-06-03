export function getInitialString(str: string) {
  const initial = str.slice(0, 1);
  if (/[ぁ-ゖァ-ヺ]/.test(initial)) {
    if (/[ぁ-おァ-オゔヴ]/.test(initial)) return "あ";
    else if (/[か-ごカ-ゴゕゖヵヶ]/.test(initial)) return "か"
    else if (/[さ-ぞサ-ゾ]/.test(initial)) return "さ"
    else if (/[た-どタ-ド]/.test(initial)) return "た"
    else if (/[な-のナ-ノ]/.test(initial)) return "な"
    else if (/[は-ぽハ-ポ]/.test(initial)) return "は"
    else if (/[ま-もマ-モ]/.test(initial)) return "ま"
    else if (/[ゃ-よャ-ヨ]/.test(initial)) return "や"
    else if (/[ら-ろラ-ロ]/.test(initial)) return "ら"
    else return "わ"
  } else if (/[a-zA-Z]/.test(initial)) return initial.toUpperCase();
  else if (/[\d]/.test(initial)) return initial;
  else return "＃";
}
