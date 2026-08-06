import _ from "lodash";
import Image from "next/legacy/image";

const ImageComponent = (props) => {
  const image = _.get(props, "image");
  const imgUrl = _.get(image, "fields.file.url");
  const imgAltText = _.get(image, "fields.title");

  if (!imgUrl) {
    return "";
  }

  return (
    <div className="w-full max-w-[520px] overflow-hidden">
      <Image
        src={`https:${imgUrl}?w=1200&fm=webp&q=85`}
        width={1200}
        height={1200}
        layout="responsive"
        objectFit="contain"
        alt={imgAltText || "Product image"}
      />
    </div>
  );
};

export default ImageComponent;
