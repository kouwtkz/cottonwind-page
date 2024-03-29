import { buildTime } from "../../data/env";
import { getJSTYear } from "../../data/functions/TimeFunctions";
import { serverSite } from "../../data/server/site";
import { SiteSnsItemType } from "../../types/SiteDataType";

export function Footer() {
  return (
    <footer>
      <div className="copyright">
        © {serverSite.author.since}-{getJSTYear(buildTime ?? new Date())}{" "}
        {serverSite.author.ename}
      </div>
      <SnsList snsList={serverSite.menu?.sns || []} />
    </footer>
  );
}

export function SnsList({
  snsList,
  maskImage = true,
}: {
  snsList: SiteSnsItemType[];
  maskImage?: boolean;
}) {
  return (
    <>
      {snsList.length > 0 ? (
        <ul className="footerLink">
          {snsList
            .filter((sns) => !sns.none && sns.mask)
            .map((sns, i) => (
              <li key={i} hidden={sns.hidden}>
                <a
                  title={sns.title || sns.name}
                  href={sns.url}
                  target={/^\w+:\/\//.test(sns.url) ? "_blank" : ""}
                  rel={sns.rel}
                >
                  {maskImage ? (
                    <div
                      className="mask"
                      style={{
                        WebkitMaskImage: `url(${sns.mask})`,
                        maskImage: `url(${sns.mask})`,
                        maskSize: "cover",
                        WebkitMaskSize: "cover",
                      }}
                    />
                  ) : (
                    sns.title || sns.name
                  )}
                </a>
              </li>
            ))}
        </ul>
      ) : null}
    </>
  );
}
