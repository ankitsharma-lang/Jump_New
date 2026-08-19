import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import _ from "lodash";
import { useRouter } from "next/router";
import { useOptimizationActions } from "@contentful/optimization-nextjs/client";
import {
  useContentfulInspectorMode,
  useContentfulLiveUpdates,
} from "@contentful/live-preview/react";
import richtextRenderOptions from "../lib/richtextRenderOptions";
import ImageComponent from "./ImageComponent";

const ProductCardComponent = (props) => {
  const router = useRouter();
  const { trackEvent } = useOptimizationActions();

  const productIndex = _.get(props, "productIndex");
  const entry = useContentfulLiveUpdates(_.get(props, "entry"));
  const baselineEntry = _.get(props, "baselineEntry");
  const inspectorProps = useContentfulInspectorMode({ entryId: entry?.sys?.id });
  const fields = { ...(baselineEntry?.fields || {}), ...(entry?.fields || {}) };
  const settings = props.settings || {};

  if (!fields) {
    return "";
  }

  const handleBuyClick = async () => {
    const slug = fields.slug;
    const isMug = slug.includes("mug");
    const eventName = isMug ? "mug_click" : "jacket_click";

    try {
      await trackEvent({
        event: eventName,
        properties: {
          product: slug,
          name: fields.title,
        },
      });
    } catch (error) {
      console.warn("Optimization tracking failed before navigation", error?.name || "");
    } finally {
      await router.push(`/products/${slug}`);
    }
  };

  const price = new Intl.NumberFormat(router.locale || "en-US", {
    style: "currency",
    currency: settings.currencyCode || "USD",
    maximumFractionDigits: 0,
  }).format(fields.price);

  return (
    <article className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/10">
      <div className="grid h-full sm:grid-cols-[1.05fr_0.95fr]">
        <div
          className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#dbeafe_0%,#ecfeff_100%)] p-8"
          {...inspectorProps({ fieldId: "image" })}
        >
          <span className="absolute left-5 top-5 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-black text-blue-950 backdrop-blur">
            0{productIndex + 1}
          </span>
          <ImageComponent
            altFallback={settings.productImageAltFallback}
            image={fields.image}
          />
        </div>
        <div className="flex flex-col justify-between p-7 sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              {settings.productCardEyebrow}
            </p>
            <h2
              className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950"
              {...inspectorProps({ fieldId: "title" })}
            >
              {fields.title}
            </h2>

            <div className="mt-4 line-clamp-5 text-sm leading-6 text-slate-600" {...inspectorProps({ fieldId: "description" })}>
              {documentToReactComponents(
                fields.description,
                richtextRenderOptions
              )}
            </div>

            <p
              className="mt-5 text-2xl font-black text-slate-950"
              {...inspectorProps({ fieldId: "price" })}
            >
              {price}
            </p>
          </div>

            <button
              onClick={handleBuyClick}
              className="mt-7 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-700"
              {...inspectorProps({ fieldId: "slug" })}
            >
              {settings.productCardCtaLabel} <span aria-hidden="true">→</span>
            </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCardComponent;
