let DOMParser = null;

export function setDomParserClass(parser) {
  DOMParser = parser;
}

export function getDomParserClass() {
  if (DOMParser) {
    return DOMParser;
  }

  if (typeof window === 'object' && window.DOMParser) {
    return window.DOMParser;
  }

  throw new Error('No DOMParser implementation detected. Refer to react-intl-formatted-xml-message for details on how to provide a polyfill.');
}
