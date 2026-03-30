import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useNinetailed } from "@ninetailed/experience.js-next";
import richtextRenderOptions from "../lib/richtextRenderOptions";
import ImageComponent from "./ImageComponent";

const ProductCardComponent = (props) => {
  const router = useRouter();
  const { track } = useNinetailed();

  const id = _.get(props, "id");
  const productIndex = _.get(props, "productIndex");
  const fields = _.get(props, "fields");

  const [indexIsOdd, setIndexIsOdd] = useState(false);

  useEffect(() => {
    if (productIndex % 2 !== 0) {
      setIndexIsOdd(true);
    }
  }, [productIndex]);

  console.log("description field", fields?.description);

  if (!fields) {
    return "";
  }

  const handleBuyClick = async () => {
  // Adjust these checks to match your actual slugs
  const slug = fields.slug;
  const isMug = slug.includes("mug");
  const eventName = isMug ? "mug_click" : "jacket_click";

  console.log("NT click event:", eventName, slug); // debug

  await track(eventName, {
    product: slug,
    name: fields.title,
  });

  router.push(`/products/${slug}`);
};

  return (
    <div className="">
      <div className="flex flex-col space-y-10x lg:space-y-0x lg:space-x-10x lg:flex-row w-full p-6x lg:py-10x lg:px-40x overflow-hidden rounded-md shadow-lg">
        <div
          className={`w-1/2 bg-blau9x bg-blau3 p-10 ${
            indexIsOdd ? "order-last" : ""
          }`}
        >
          <ImageComponent image={fields.image} />
        </div>
        <div className="w-1/2 bg-gelb p-10 flex flex-col items-center">
          <div className="h-1/3"></div>
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-bold">{fields.title}</h2>

            <div>
              {documentToReactComponents(
                fields.description,
                richtextRenderOptions
              )}
            </div>

            <p className="text-xl">${fields.price}</p>

            <button
              onClick={handleBuyClick}
              className="bg-black text-white hover:bg-neuter rounded shadow-md"
            >
              BUY
            </button>
          </div>

          <div className="h-1/3"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardComponent;