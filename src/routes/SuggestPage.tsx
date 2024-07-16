export default function SuggestPage() {
  return (
    <main className="h1h4Page">
      <h1>SUGGEST</h1>
      <h4>類似サイトへの誘導</h4>
      <div className="gridLink">
        <a
          href="https://www.cottonwinds.com/"
          target="_blank"
          rel="noopener"
          title="www.cottonwinds.com"
        >
          <h2>Cotton Winds (www.cottonwinds.com)</h2>
          <h4>Empresa textil ubicada en Mataró.</h4>
          <div>(※Not related to my site, but a lead for a typo)</div>
        </a>
        <a href="/" title="トップに戻る">
          <h2>こっとんうぃんど (cottonwind.com)</h2>
          <h4>
            Portfolio site of artist "
            {import.meta.env.VITE_AUTHOR_EN_NAME_ON_PROP ||
              import.meta.env.VITE_AUTHOR_EN_NAME}
            ". (This site)
          </h4>
          <div>わたかぜコウのサイトはこちらです！</div>
        </a>
      </div>
    </main>
  );
}
