module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '6.14.2',

        // support policy:
        // - IE 10/11 fow now until it dies out.
        // - Chrome >= 49 for Windows XP (yeah I know)
        // - Oldest downloadable Firefox ESR
        // - Last 3 versions of the others
        browsers: ['last 3 versions', 'IE >= 10', 'Chrome >= 49', 'Firefox >= 52']
      },
      modules: process.env.MODULE === 'esm' ? false : process.env.MODULE,
    }],
    '@babel/preset-react',
    '@babel/preset-flow',
  ],
};
