const { version } = require('./package.json');

module.exports = ({ config }) => {
  return {
    ...config,
    version,
  };
};
