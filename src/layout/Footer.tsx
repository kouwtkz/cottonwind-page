// import { buildTime } from "../data/env";
import { getJSTYear } from "../data/functions/TimeFunctions";
import { useAtom } from "jotai";
import { EnvAtom } from "../state/EnvState";

export function Footer() {
  const [env] = useAtom(EnvAtom);
  return (
    <footer>
      {env ? (
        <div className="copyright">
          © {env.SINCE}-{getJSTYear(new Date())} {env.AUTHOR_ACCOUNT}
        </div>
      ) : null}
      <LinksList myLinks={env?.LINKS || []} />
    </footer>
  );
}

export function LinksList({
  myLinks,
  maskImage = true,
}: {
  myLinks: SiteMyLinksItemType[];
  maskImage?: boolean;
}) {
  return (
    <>
      {myLinks.length > 0 ? (
        <ul className="footerLink">
          {myLinks
            .filter((link) => !link.none && link.mask)
            .map((link, i) => (
              <li key={i} hidden={link.hidden}>
                <a
                  title={link.title || link.name}
                  href={link.url}
                  target={/^\w+:\/\//.test(link.url) ? "_blank" : ""}
                  rel={link.rel ?? "noopener"}
                >
                  {maskImage && link.mask ? (
                    <div
                      className="mask"
                      style={
                        link.mask.startsWith("#")
                          ? { clipPath: `url(${link.mask})` }
                          : {
                              WebkitMaskImage: `url(${link.mask})`,
                              maskImage: `url(${link.mask})`,
                              maskSize: "cover",
                              WebkitMaskSize: "cover",
                            }
                      }
                    />
                  ) : (
                    link.title || link.name
                  )}
                </a>
              </li>
            ))}
        </ul>
      ) : null}
    </>
  );
}
