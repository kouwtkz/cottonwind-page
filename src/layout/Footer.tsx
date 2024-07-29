import { buildTime } from "@/data/env";
import { getJSTYear } from "@/data/functions/TimeFunctions";
import SiteConfigList from "@/data/config.list";

export function Footer() {
  return (
    <footer>
      <div className="copyright">
        © {import.meta.env.VITE_SINCE}-{getJSTYear(buildTime ?? new Date())}{" "}
        {import.meta.env.VITE_AUTHOR_ACCOUNT}
      </div>
      <LinksList myLinks={SiteConfigList.links || []} />
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
                  rel={link.rel}
                >
                  {maskImage ? (
                    <div
                      className="mask"
                      style={{
                        WebkitMaskImage: `url(${link.mask})`,
                        maskImage: `url(${link.mask})`,
                        maskSize: "cover",
                        WebkitMaskSize: "cover",
                      }}
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
