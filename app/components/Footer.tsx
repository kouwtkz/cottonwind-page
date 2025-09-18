import ShareButton from "./button/ShareButton";
import SvgMaskSns from "./svg/mask/SvgMaskSns";
import { ArrayEnv } from "../Env";
import { getYear } from "./functions/DateFunction";
import type { OmittedEnv } from "types/custom-configuration";

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
      <LinksList myLinks={ArrayEnv.LINKS || []} />
    </footer>
  );
}

export function LinksList({
  myLinks,
  noMaskImage,
  noShareButton,
}: {
  myLinks: SiteMyLinksItemType[];
  noMaskImage?: boolean;
  noShareButton?: boolean;
}) {
  return (
    <>
      {myLinks.length > 0 ? (
        <ul className="footerLink wide">
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
