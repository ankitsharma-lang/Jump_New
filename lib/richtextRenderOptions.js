import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";

const Bold = ({ children }) => (
  <span className="font-bold text-blue-500"> {children} </span>
);
const Heading1 = ({ children }) => (
  <div className="mb-4">
    <span className="text-3xl md:text-4xl font-bold text-slate-950">
      {" "}
      {children}{" "}
    </span>{" "}
  </div>
);

const Heading2 = ({ children }) => (
  <div className="mb-4">
    <span className="text-2xl md:text-3xl font-bold text-slate-950">
      {" "}
      {children}{" "}
    </span>{" "}
  </div>
);
const Parag = ({ children }) => (
  <div className="mb-4">
    <p className="leading-7"> {children} </p>{" "}
  </div>
);

const HyperLNK = ({ node, children }) => {
  const URI = node?.data?.uri;
  return (
    <span className="font-bold text-blue-700 underline decoration-blue-200 underline-offset-4">
      {" "}
      <a href={URI} target="_blank" rel="noreferrer">
        {" "}
        {/* {URI} */} {children}{" "}
      </a>{" "}
    </span>
  );
};
const CustomView = () => {
  return <></>;
};

const richtextRenderOptions = {
  renderMark: {
    [MARKS.BOLD]: (text) => <Bold> {text} </Bold>,
  },
  renderNode: {
    [BLOCKS.HEADING_1]: (node, children) => {
      return <Heading1> {children} </Heading1>;
    },
    [BLOCKS.HEADING_2]: (node, children) => {
      return <Heading2> {children} </Heading2>;
    },
    [BLOCKS.PARAGRAPH]: (node, children) => {
      return <Parag> {children} </Parag>;
    },
    [INLINES.HYPERLINK]: (node, children) => {
      return <HyperLNK node={node}> {children} </HyperLNK>;
    },
  },
};

export default richtextRenderOptions;
