
import * as contentful from "contentful";
import _ from "lodash";
import { getTimelinePreviewConfig } from "./contentful-preview.mjs";

const space_id =
  process.env.CONTENTFUL_SPACE_ID || process.env.NEXT_PUBLIC_SPACE_ID;
const access_token =
  process.env.CONTENTFUL_DELIVERY_TOKEN ||
  process.env.CONTENTFUL_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_DELIVERY_TOKEN;
const preview_token =
  process.env.CONTENTFUL_PREVIEW_TOKEN || process.env.NEXT_PUBLIC_PREVIEW_TOKEN;
const environment =
  process.env.CONTENTFUL_ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT;

const getOptions = (is_preview, timeline = null) => {
  let options = {};
  options.space = space_id;
  options.environment = environment ? environment : "master";

  if (is_preview) {
    options.host = "preview.contentful.com";
    options.accessToken = preview_token;

    const timelinePreview = getTimelinePreviewConfig(timeline);
    if (timelinePreview) options.timelinePreview = timelinePreview;
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
    console.error(
      "Contentful locale request failed",
      error?.response?.status || error?.status || error?.code || ""
    );
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
      let params = {
        content_type: content_type,
        include: 10,
        locale: "en-US",
      };

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
    // Do not log the full SDK error: its request config contains API tokens.
    console.error(
      "Contentful entry request failed",
      error?.response?.status || error?.status || error?.code || ""
    );
    return false;
  }
};
