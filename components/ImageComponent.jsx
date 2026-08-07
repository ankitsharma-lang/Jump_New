import _ from "lodash";
import Image from "next/image";
import { buildContentfulImageUrl } from "../lib/contentful-image";

const ImageComponent = (props) => {
  const image = _.get(props, "image");
  const imgUrl = _.get(image, "fields.file.url");
  const imgAltText = _.get(image, "fields.title");

  if (!imgUrl) {
    return "";
  }

  const transformedUrl = buildContentfulImageUrl(imgUrl, {
    width: 1200,
    height: 1200,
    fit: "pad",
    format: "webp",
    quality: 85,
  });

  return (
    <div className="relative aspect-square w-full overflow-hidden">
      <Image
        src={transformedUrl}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-contain"
        alt={imgAltText || props.altFallback || ""}
      />
    </div>
  );
};

export default ImageComponent;
