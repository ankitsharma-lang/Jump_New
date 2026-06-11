
import * as contentful from "contentful";
import _ from "lodash";
import { parseTimeline } from "@contentful/timeline-preview";

const space_id = process.env.NEXT_PUBLIC_SPACE_ID;
const access_token = process.env.NEXT_PUBLIC_DELIVERY_TOKEN;
const preview_token = process.env.NEXT_PUBLIC_PREVIEW_TOKEN;
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

const getOptions = (is_preview, timeline = null) => {
  let options = {};
  options.space = space_id;
  options.environment = environment ? environment : "master";

  if (is_preview) {
    options.host = "preview.contentful.com";
    options.accessToken = preview_token;

    // Timeline support — parse release ID and timestamp
    if (timeline) {
      try {
        const parsed = parseTimeline(timeline);
        if (parsed?.releaseId) {
          options.headers = {
            "X-Contentful-Release-Id": parsed.releaseId,
          };
        }
      } catch (e) {
        console.log("Timeline parse error:", e);
      }
    }
  } else {
    options.accessToken = access_token;
  }

  return options;
};

export const getAllLocales = async () => {
  const options = getOptions(false);
  const contentfulClient = contentful.createClient(options);
  try {
    let allLocales = await contentfulClient.getLocales();
    let dataType = _.get(allLocales, "sys.type");
    let items = _.get(allLocales, "items");
    if (dataType === "Array") {
      return items;
    } else {
      return false;
    }
  } catch (error) {
    console.log("getAllLocales error ", error);
  }
};

export const getEntriesByContentType = async (
  content_type,
  slug = null,
  preview = false,
  timeline = null
) => {
  const options = getOptions(preview, timeline);

  try {
    const contentfulClient = contentful.createClient(options);
    if (contentfulClient) {
      let params = { content_type: content_type, include: 3 };

      if (slug) {
        params["fields.slug"] = slug;
      }

      let entries = await contentfulClient.getEntries(params);
      const items = _.get(entries, "items");
      return { items };
    } else {
      return false;
    }
  } catch (error) {
    console.log("any errors? ->", error);
    return false;
  }
};
