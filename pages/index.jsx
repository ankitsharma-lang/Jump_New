import _ from "lodash";
import ProductSection from "../components/ProductSection";
import { getEntriesByContentType } from "../lib/helpers";
import { Experience } from "@ninetailed/experience.js-next";
import { ExperienceMapper } from "@ninetailed/experience.js-utils-contentful";

function LandingPage(page) {
  const sections = _.get(page, "fields.sections");
  const headline = _.get(page, "fields.headline");

  return (
    <>
      <h1 className="font-bold text-2xl mb-4 text-center">{headline}</h1>
      <div className="flex flex-col space-y-4">
        {Array.isArray(sections)
          ? sections.map((section) => {
              const contentType = _.get(section, "sys.contentType.sys.id");
              const sectionId = _.get(section, "sys.id");
              const fields = _.get(section, "fields");

              if (contentType === "productSection") {
                return (
                  <ProductSection
                    key={sectionId}
                    id={sectionId}
                    fields={fields}
                  />
                );
              }

              return null;
            })
          : null}
      </div>
    </>
  );
}

export default function Home({ page }) {
  const experiences = (page?.fields?.nt_experiences || [])
    .filter(ExperienceMapper.isExperienceEntry)
    .map(ExperienceMapper.mapExperience);

  return (
    <Experience
      {...page}
      id={page.sys.id}
      component={LandingPage}
      experiences={experiences}
    />
  );
}


export async function getStaticProps() {
  const pageEntries = await getEntriesByContentType("landingPage", "home-page");

  const safeEntries = JSON.parse(
    JSON.stringify(pageEntries, (key, value) => {
      if (key === "page") return undefined;
      return value;
    })
  );

  const homepageEntry = _.get(safeEntries, "items[0]", {});

  return {
    props: {
      page: homepageEntry,
    },
    revalidate: 30,
  };
}
