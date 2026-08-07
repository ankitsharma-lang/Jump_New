import _ from "lodash";
import { OptimizedEntry } from "../lib/optimization";
import ProductCardComponent from "./ProductCardComponent";
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from "@contentful/live-preview/react";

const ProductSection = (props) => {
  const entry = useContentfulLiveUpdates(_.get(props, "entry"));
  const baselineEntry = _.get(props, "baselineEntry");
  const inspectorProps = useContentfulInspectorMode({ entryId: entry?.sys?.id });
  const fields = { ...(baselineEntry?.fields || {}), ...(entry?.fields || {}) };
  const title = _.get(fields, "title");
  const products = _.get(fields, "products");
  const settings = props.siteSettings?.fields || {};

  if (!fields) {
    return "";
  }
  return (
    <section className="py-4">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            {fields.eyebrow}
          </p>
        <h2
            className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
          {...inspectorProps({ fieldId: "title" })}
        >
          {title}
        </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          {fields.description}
        </p>
      </div>

      <div className="grid gap-7 lg:grid-cols-2" {...inspectorProps({ fieldId: "products" })}>
          {Array.isArray(products)
            ? products.map((product, productIndex) => {
                const productId = _.get(product, "sys.id");
                return (
                <OptimizedEntry
                  baselineEntry={product}
                  clickable
                  key={productId}
                  liveUpdates
                  trackClicks
                  trackHovers
                  trackViews
                >
                    {(resolvedProduct) => (
                      <ProductCardComponent
                        baselineEntry={product}
                        productIndex={productIndex}
                        entry={resolvedProduct}
                        settings={settings}
                      />
                    )}
                  </OptimizedEntry>
                );
              })
            : ""}
        </div>
    </section>
  );
};

export default ProductSection;
