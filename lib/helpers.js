
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

export const getContentfulEnvironment = () => environment || "master";

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
  timeline = null,
  locale = "en-US"
) => {
  const options = getOptions(preview, timeline);

  try {
    const contentfulClient = contentful.createClient(options);
    if (contentfulClient) {
      let params = {
        content_type: content_type,
        include: 10,
        locale,
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

export const getEntriesByField = async (
  contentType,
  fieldId,
  value,
  preview = false,
  timeline = null,
  locale = "en-US"
) => {
  const options = getOptions(preview, timeline);

  try {
    const contentfulClient = contentful.createClient(options);
    const entries = await contentfulClient.getEntries({
      content_type: contentType,
      include: 10,
      locale,
      [`fields.${fieldId}`]: value,
    });
    return { items: _.get(entries, "items", []) };
  } catch (error) {
    console.error(
      "Contentful field query failed",
      error?.response?.status || error?.status || error?.code || ""
    );
    return false;
  }
};

export const getEntryById = async (
  entryId,
  preview = false,
  timeline = null,
  locale = "en-US"
) => {
  if (!entryId) return false;

  try {
    const contentfulClient = contentful.createClient(getOptions(preview, timeline));
    return await contentfulClient.getEntry(entryId, { include: 10, locale });
  } catch (error) {
    console.error(
      "Contentful entry request failed",
      error?.response?.status || error?.status || error?.code || ""
    );
    return false;
  }
};

export const getEntryByIdAllLocales = async (entryId, preview = false) => {
  if (!entryId) return false;

  try {
    const contentfulClient = contentful.createClient(getOptions(preview)).withAllLocales;
    return await contentfulClient.getEntry(entryId, { include: 10 });
  } catch (error) {
    console.error(
      "Contentful all-locales request failed",
      error?.response?.status || error?.status || error?.code || ""
    );
    return false;
  }
};

function mergeLocalizedValue(defaultValue, localizedValue) {
  if (localizedValue === undefined || localizedValue === null || localizedValue === "") {
    return defaultValue;
  }

  if (Array.isArray(defaultValue) && Array.isArray(localizedValue)) {
    return localizedValue.map((localizedItem, index) => {
      const defaultItem = localizedItem?.sys?.id
        ? defaultValue.find((item) => item?.sys?.id === localizedItem.sys.id)
        : defaultValue[index];
      return mergeLocalizedValue(defaultItem, localizedItem);
    });
  }

  if (
    defaultValue?.sys?.id &&
    localizedValue?.sys?.id === defaultValue.sys.id &&
    (defaultValue.sys.type === "Entry" || defaultValue.sys.type === "Asset")
  ) {
    const fieldIds = new Set([
      ...Object.keys(defaultValue.fields || {}),
      ...Object.keys(localizedValue.fields || {}),
    ]);
    const fields = {};

    fieldIds.forEach((fieldId) => {
      fields[fieldId] = mergeLocalizedValue(
        defaultValue.fields?.[fieldId],
        localizedValue.fields?.[fieldId]
      );
    });

    return { ...defaultValue, ...localizedValue, fields };
  }

  return localizedValue;
}

export const getLocalizedEntryBySlug = async (
  contentType,
  slug,
  preview = false,
  timeline = null,
  locale = "en-US",
  defaultLocale = "en-US"
) => {
  const defaultEntries = await getEntriesByContentType(
    contentType,
    slug,
    preview,
    timeline,
    defaultLocale
  );
  const defaultEntry = _.get(defaultEntries, "items[0]");

  if (!defaultEntry || locale === defaultLocale) return defaultEntries;

  const localizedEntry = await getEntryById(
    defaultEntry.sys.id,
    preview,
    timeline,
    locale
  );

  return {
    items: [mergeLocalizedValue(defaultEntry, localizedEntry || defaultEntry)],
  };
};

export const getLocalizedEntryByField = async (
  contentType,
  fieldId,
  value,
  preview = false,
  timeline = null,
  locale = "en-US",
  defaultLocale = "en-US"
) => {
  const defaultEntries = await getEntriesByField(
    contentType,
    fieldId,
    value,
    preview,
    timeline,
    defaultLocale
  );
  const defaultEntry = _.get(defaultEntries, "items[0]");

  if (!defaultEntry || locale === defaultLocale) return defaultEntries;

  const localizedEntry = await getEntryById(
    defaultEntry.sys.id,
    preview,
    timeline,
    locale
  );

  return {
    items: [mergeLocalizedValue(defaultEntry, localizedEntry || defaultEntry)],
  };
};
