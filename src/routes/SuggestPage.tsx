import { Link } from "react-router-dom";

export default function SuggestPage() {
  return (
    <div className="h1h4Page">
      <h1>SUGGEST</h1>
      <h4>他のサイトと間違えてませんか…？</h4>
      <div className="gridLink">
        <a
          href="https://www.cottonwinds.com/"
          target="_blank"
          rel="noopener"
          title="cottonwinds.com"
        >
          <h2>cottonwinds.com</h2>
          <h4>Empresa textil ubicada en Mataró.</h4>
          <div>(※Not related to my site, but a lead for a typo)</div>
        </a>
        <Link to="/" title="トップに戻る">
          <h2>kouwtkz.cottonwind.com</h2>
          <h4>Portfolio site of artist Kou Watakaze. (This site)</h4>
          <div>わたかぜコウのサイトはこちらです！</div>
        </Link>
      </div>
    </div>
  );
}
