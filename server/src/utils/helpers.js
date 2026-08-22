const escapeRegex = (text) => {
  if (!text) return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

module.exports = {
  escapeRegex,
};
