let DOMParserPolyfill = null;

export function setDomParserClass(parser) {
  DOMParserPolyfill = parser;
}

/* @__PURE__ */
export function getDomParserClass() {
  if (DOMParserPolyfill) {
    return DOMParserPolyfill;
  }

  // return global version of DOMParser
  if (typeof DOMParser !== 'undefined') {
    return DOMParser;
  }

  throw new Error('No DOMParser implementation detected. Refer to react-intl-formatted-xml-message for details on how to provide a polyfill.');
}
