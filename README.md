# react-intl-formatted-xml-message

*react-intl with rich text*

## What does this solve?

React-Intl's support for rich text ranges from pretty difficult to use, to completely impossible depending on your use case.

Existing solutions all have flaws:
- `FormattedHTMLMessage` requires escaping variables (unsafe by default, escaping can be difficult) and only supports `react-dom`.
- Injecting React Elements using `FormattedMessage`'s `values` prop causes issues when the tag itself contains text that needs to be translated and becomes verbose very quickly
- Markdown does not support custom React Elements (other than this, it's a pretty good solution).

Related Threads:
- https://github.com/yahoo/react-intl/issues/68#issuecomment-276702602
- https://github.com/yahoo/react-intl/issues/513

---

This library exposes a new `FormattedXmlMessage` component which fixes the flaws of `FormattedHTMLMessage`:
- Injected variables are never parsed. Safe by default.
- XML Tags can be mapped to React Components and React Elements.
- It uses `DOMParser` instead of `dangerouslySetInnerHTML`, meaning it can be used in environments that do not support `react-dom` (as long as DOMParser is polyfilled).

## Usage

`npm i react-intl-formatted-xml-message`

`FormattedXmlMessage` behaves like `FormattedMessage` with the following exceptions:
- The message is parsed as XML
- You can provide a list of React Components, React Elements, or other tag names (as strings) to replace XML tags present in your message using the `tags` prop.
  - If a React Element is provided, its props will be merged with the attributes of the XML Tag. The XML tag takes precedence if the same attribute/prop is provided on both.
  - If a React Component is provided, a React Element will be created using the component.
  - If a string is provided or if nothing is provided, the XML will be converted to React DOM elements.

```javascript
import { FormattedXmlMessage } from 'react-intl-formatted-xml-message';

const messages = {
  tosLabel: {
    id: 'tos',
    defaultMessage: '<em>By using our services, you agree to our <tos-link to="/en/tos">Terms Of Service</tos-link></em>'
  },
};

function TosLabel(props) {

  return (
    <FormattedXmlMessage
      {...messages.tosLabel}
      tags={{
        'tos-link': <a href="/tos" target="_blank" rel="noopener noreferrer" />,
      }}
    />
  );
}

ReactDomServer.renderToString(<TosLabel />);
// output:
// <span><em>By using our services, you agree to our <a to="/en/tos" target="_blank" rel="noopener noreferrer">Terms Of Service</a></em></span>
```

## Polyfills

This library requires the environment to provide the following in order to work:

- `Array.from`
- `Object.values`
- `Object.keys`
- `DOMParser` (https://github.com/jsdom/jsdom/issues/1368 or https://www.npmjs.com/package/xmldom or https://www.npmjs.com/package/dom-parser)

Note: In order to avoid polluting the global scope on Node with DOM extensions, you can use `setDomParserClass` method to provide DOMParser without setting a global:

```javascript
import { setDomParserClass } from 'react-intl-formatted-xml-message';
import { DOMParser } from 'xmldom';
import TosLabel from './TosLabel';

setDomParserClass(DOMParser);

ReactDomServer.renderToString(<TosLabel />);
```
