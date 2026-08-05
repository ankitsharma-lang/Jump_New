import _ from "lodash";
import { OptimizedEntry } from "../lib/optimization";
import ProductCardComponent from "./ProductCardComponent";

const ProductSection = (props) => {
  const entry = _.get(props, "entry");
  const fields = _.get(entry, "fields");
  const title = _.get(fields, "title");
  const products = _.get(fields, "products");

  if (!fields) {
    return "";
  }
  return (
    <div className="">
      {/* {JSON.stringify(products)} */}
      <div className="bg-red-100x flex flex-col space-y-8 p-20 border-2 rounded-md shadow-md">
        <h2 className="font-bold text-2xl text-center">{title}</h2>

        {Array.isArray(products)
          ? products.map((product, productIndex) => {
              const productId = _.get(product, "sys.id");
              return (
                <OptimizedEntry key={productId} baselineEntry={product}>
                  {(resolvedProduct) => (
                    <ProductCardComponent
                      productIndex={productIndex}
                      entry={resolvedProduct}
                    />
                  )}
                </OptimizedEntry>
              );
            })
          : ""}
      </div>
    </div>
  );
};

export default ProductSection;
