// @flow

import React from 'react';
import { injectIntl } from 'react-intl';
import { getDomParserClass } from './dom-parser';
import { hasOwnProperty } from './util';

let domParserInstance = null;
function getParser() {
  if (!domParserInstance) {
    const Parser = getDomParserClass();
    domParserInstance = new Parser();
  }

  return domParserInstance;
}

type TagMap = { [string]: any };
type ValueMap = { [string]: any };

type Props = {
  id: string,
  defaultMessage: string,
  tags: TagMap,
  values: ValueMap,
};

/**
 * Similar to FormattedMessage but allows inserting XML tag in the formatted message
 * that will mapped to react elements when rendering.
 *
 * The "tags" property of the props object is provides the mapping.
 * Allowed replacements are:
 * - Strings or React Components: New instances of these components will be created and used as replacement.
 * - React elements: These elements will be cloned and their props will be merged with the ones provided in the formatted text, with the latter taking precedence.
 */
function FormattedXmlMessage(props: Props) {

  const { tags = {}, values = {}, intl, ...descriptor } = props;
  const { textComponent: Text, formatMessage } = intl;

  // We replace the "values" object with placeholders XML tags
  // so the content of "values" are never parsed by the XML parser
  // as they often come from user-generated content.
  // This also allows inject arrays and JSX tags as values like FormattedMessage.
  const placeholderNodeName = getPlaceholderNodeName();
  const safeValues = getPlaceholderValues(values, placeholderNodeName);

  const localizedMessage = formatMessage(descriptor, safeValues);

  const xmlMessage = `<?xml version="1.0" ?><root>${localizedMessage}</root>`;

  // we force XML (not html) so it's easier to parse (polyfills) and closer to JSX.
  const doc = getParser().parseFromString(xmlMessage, 'text/xml');
  const root = doc.children[0];

  return (
    <Text>
      {xmlToJsx(Array.from(root.childNodes), {
        tags,
        placeholderNodeName,
        values: Object.values(values),
      })}
    </Text>
  );
}

/**
 * Replace unsafe or xml-incompatible values with xml-safe placeholders.
 *
 * @param values The map of values to replace.
 * @param placeholderNodeName The name of the node to use as a placeholder.
 * @returns A map of values in which unsafe values have been replaced with placeholders
 *
 * @__PURE__
 */
function getPlaceholderValues(values: ValueMap, placeholderNodeName: string): ValueMap {
  const keys = Object.keys(values);

  const replacements = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = values[key];

    // we replace strings in case they contain HTML
    // and we replace
    if (value == null || (typeof value !== 'string' && typeof value !== 'object')) {
      replacements[key] = value;
      continue;
    }

    // use key indice, as "key" could be any user-provided string
    // whereas i is always a number we control.
    replacements[key] = `<${placeholderNodeName} ki="${i}" />`;
  }

  return replacements;
}

/**
 * Returns the value the placeholder node was replacing.
 *
 * @param values The map of values to replace.
 * @param placeholderNode The instance of the node that was replacing the value.
 * @returns The original value
 *
 * @__PURE__
 */
function getOriginalValueFromPlaceholder(placeholderNode, values: any[]): any {
  const keyIndex = placeholderNode.attributes.ki.value;

  return values[keyIndex];
}

/**
 * @returns an XML-compliant randomly-generated Node Name
 * designed to prevent collisions with message content.
 *
 * @__PURE__
 */
function getPlaceholderNodeName() {
  // Creates a token with a random UID that should not be guessable or
  // conflict with other parts of the `message` string.
  // Inspired directly from React-Intl
  // https://github.com/yahoo/react-intl/blob/master/src/components/message.js#L76
  const token = Math.floor(Math.random() * 0x10000000000).toString(16);

  return `ri-f-xml-m-variable-${token}`;
}

/**
 * Maps a parsed DOM Node to its react equivalent.
 * If the node has a matching user-defined replacement (via tags attribute), that replacement will be returned.
 * Otherwise, the react-dom equivalent will be returned.
 *
 * @returns The JSX replacement of the DOM Node.
 *
 * @__PURE__
 */
function xmlNodeToJsx(node: Node, replacements: TagMap): string | Function | Object {
  if (hasOwnProperty(replacements, node.nodeName)) {
    return replacements[node.nodeName];
  }

  return node.nodeName;
}

/**
 * Converts a NamedNodeMap to Object containing the same key => value pairs.
 *
 * @param attributeList The NamedNodeMap to convert.
 * @returns An object containing the same key => value pairs as the attributeList parameter.
 *
 * @__PURE__
 */
function xmlAttributesToJsx(attributeList: NamedNodeMap): Object {
  const jsxAttributes = {};

  for (let i = 0; i < attributeList.length; i++) {
    const attribute = attributeList[i];

    jsxAttributes[attribute.name] = attribute.value;
  }

  return jsxAttributes;
}

/**
 * Converts an array of DOM Nodes into an array of React Elements (including strings, and sub-arrays).
 *
 * @param nodes The nodes to convert into to react elements.
 * @param options A bag of options
 * @param options.tags The tags containing the mapping from DOM Nodes to custom React Elements.
 * @param options.placeholderNodeName The name of the DOM Node used as a placeholder for variables injected into the text.
 * @param options.values The list of values to use in the place of placeholder DOM Nodes
 * @returns A react-compatible version of the nodes parameter.
 *
 * @__PURE__
 */
function xmlToJsx(nodes: Node[], options: {
  tags: TagMap,
  placeholderNodeName: string,
  values: any[],
}) {

  return nodes.map((node, i) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      console.error('Only Text and Element nodes are supported.', node);
      return null;
    }

    if (node.nodeName === options.placeholderNodeName) {
      const value = getOriginalValueFromPlaceholder(node, options.values);

      if (React.isValidElement(value)) {
        // set "key" prop on replaced value so react doesn't warn about it.
        return React.cloneElement(value, { key: i });
      }

      return value;
    }

    const nodeReplacement = xmlNodeToJsx(node, options.tags);
    const attributes = xmlAttributesToJsx(node.attributes);

    // if anyone has a better idea for a key here, feedback would be highly appreciated!
    // Although it should not matter as the order is never going to change.
    attributes.key = i;

    let children = xmlToJsx(Array.from(node.childNodes), options);

    // some tags, such as <br />, cannot have any children. Even if it's an empty array.
    if (children.length === 0) {
      children = null;
    }

    // replacement is a Component, make a new instance of it.
    if (typeof nodeReplacement === 'function' || typeof nodeReplacement === 'string') {
      // JSX elements must start with an uppercase letter if they are a variable.
      const Tag = nodeReplacement;

      return <Tag {...attributes}>{children}</Tag>;
    }

    // replacement is an instantiated react node. Merge props (formatted text takes precedence).
    if (React.isValidElement(nodeReplacement)) {
      return React.cloneElement(nodeReplacement, attributes, children);
    }

    // is invalid
    console.error('Invalid replacement: Must be a tag name, a Component, or a React Element', nodeReplacement);
    return null;
  });
}

export default injectIntl(FormattedXmlMessage);
