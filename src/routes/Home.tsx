import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="topPage">
      <ul>
        <li>
          <Link to="/gallery">ギャラリー</Link>
        </li>
        <li>
          <Link to="/character">キャラクター</Link>
        </li>
        <li>
          <Link to="/work">かつどう</Link>
        </li>
        <li>
          <Link to="/sound">おんがく</Link>
        </li>
        <li>
          <Link to="/info">じょうほう</Link>
        </li>
      </ul>
    </div>
  );
}
