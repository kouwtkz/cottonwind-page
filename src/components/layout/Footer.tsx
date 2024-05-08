import { buildTime } from "../../data/env";
import { getJSTYear } from "../../data/functions/TimeFunctions";
import SiteConfigList from "@/data/config.list";

export function Footer() {
  return (
    <footer>
      <div className="copyright">
        © {import.meta.env.VITE_SINCE}-{getJSTYear(buildTime ?? new Date())}{" "}
        {import.meta.env.VITE_AUTHOR_ENAME}
      </div>
      <SnsList snsList={SiteConfigList.sns || []} />
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
