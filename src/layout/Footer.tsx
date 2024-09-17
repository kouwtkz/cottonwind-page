import { getJSTYear } from "../data/functions/TimeFunctions";

export function Footer({ env }: { env?: SiteConfigEnv }) {
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
