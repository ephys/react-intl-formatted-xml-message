module.exports = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        node: "6.14.2",
        // TODO browsers
      },
      modules: process.env.MODULE === 'esm' ? false : process.env.MODULE,
    }],
    "@babel/preset-react",
    "@babel/preset-flow",
  ],
};
