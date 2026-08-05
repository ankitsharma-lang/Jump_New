import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import _ from "lodash";
import Head from "next/head";
import ImageComponent from "../../components/ImageComponent";
import { getEntriesByContentType } from "../../lib/helpers";
import { OptimizedEntry } from "../../lib/optimization";
import richtextRenderOptions from "../../lib/richtextRenderOptions";
import { useOptimizationContext } from "@contentful/optimization-nextjs/client";

const ProductDetails = ({ product }) => {
  const fields = _.get(product, "fields");
  const title = _.get(product, "fields.title");

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="p-20 flex flex-col space-y-4 h-screen items-center">
        <div className="w-full rounded shadow-xl">
          <ImageComponent image={fields.image} />
        </div>
        <h1 className="text-3xl mb-4 font-bold">{title}</h1>
        <p className=" text-xl text-blau">${fields.price}</p>
        <div className="">
          {documentToReactComponents(fields.description, richtextRenderOptions)}
        </div>
      </div>
    </>
  );
};

const ProductPage = (props) => {
  const { error } = useOptimizationContext();
  const product = _.get(props, "product.items[0]");

  if (!product?.sys?.id || error) {
    return <ProductDetails product={product} />;
  }

  return (
    <OptimizedEntry baselineEntry={product}>
      {(resolvedProduct) => <ProductDetails product={resolvedProduct} />}
    </OptimizedEntry>
  );
};

export async function getStaticPaths() {
  const productEntries = await getEntriesByContentType("product");

  let paths = [];
  if (productEntries) {
    try {
      paths = productEntries.items.map((entry) => {
        const slugVal = _.get(entry, "fields.slug");
        return { params: { slug: slugVal } };
      });
    } catch (error) {}
  }

  return {
    paths: paths,
    fallback: false,
  };
}

export async function getStaticProps(context) {
  const slug = _.get(context, "params.slug");
  const product = await getEntriesByContentType("product", slug);

  return {
    props: { product },
  };
}

export default ProductPage;
