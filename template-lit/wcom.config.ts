import { litPlugin, markdownPlugin, vscodePlugin } from "@wcom/cli";
import prettier from "prettier";

export default [
  litPlugin(),
  markdownPlugin({
    async transformContent(_, content) {
      return prettier.format(content, {
        arrowParens: "avoid",
        parser: "markdown",
        singleQuote: true,
        trailingComma: "all",
      });
    },
  }),
  vscodePlugin(),
];
