import ShareButton from "./button/ShareButton";
import SvgMaskSns from "./svg/mask/SvgMaskSns";
import { EnvLinksMap, EnvLINKS } from "../Env";
import { getYear } from "./functions/DateFunction";
import type { OmittedEnv } from "types/custom-configuration";
import { useMemo } from "react";

interface FooterProps {
  env?: Partial<OmittedEnv>;
}
export function Footer({ env }: FooterProps) {
  return (
    <footer>
      <div>
        <span className="copyright">
          © {env?.SINCE}-{getYear(new Date())} {env?.AUTHOR_ACCOUNT}
        </span>
      </div>
      <LinksList env={env} />
    </footer>
  );
}

export function LinksList({
  env,
  noMaskImage,
  noShareButton,
}: {
  env?: Partial<OmittedEnv>;
  noMaskImage?: boolean;
  noShareButton?: boolean;
}) {
  const myLinks = useMemo(() => {
    const footerLinks = env?.FOOTER_LINKS;
    if (footerLinks) {
      const [links, map] = footerLinks.reduce<
        [SiteMyLinksItemType[], Map<string, void>]
      >(
        (a, c) => {
          const link = EnvLinksMap.get(c);
          if (link) {
            a[0].push(link);
            a[1].set(c);
          }
          return a;
        },
        [[], new Map()]
      );
      EnvLINKS.forEach((link) => {
        if (!map.has(link.key)) {
          links.push({ ...link, hidden: true });
        }
      });
      return links;
    } else return EnvLINKS;
  }, [env]);
  return (
    <>
      {myLinks.length > 0 ? (
        <ul className="footerLink wide">
          {myLinks
            .filter((link) => !link.none)
            .map((link, i) => (
              <li key={i} hidden={link.hidden}>
                <a
                  title={link.title || link.name}
                  href={link.url}
                  target={/^\w+:\/\//.test(link.url) ? "_blank" : ""}
                  rel={link.rel ?? "noopener"}
                >
                  {!noMaskImage && link.mask ? (
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
          <li>{noShareButton ? null : <ShareButton className="color" />}</li>
        </ul>
      ) : null}
      {noMaskImage ? null : <SvgMaskSns />}
    </>
  );
}
