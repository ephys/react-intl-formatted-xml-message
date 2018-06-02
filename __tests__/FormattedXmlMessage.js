// @flow

import * as React from 'react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { mountWithIntl } from 'enzyme-react-intl';
import { FormattedXmlMessage } from '../';

Enzyme.configure({ adapter: new Adapter() });

// TODO:
// - respects IntlProvider config

describe('FormattedXmlMessage', () => {

  it('Converts XML tags into react-dom elements', () => {
    const message = {
      id: 'test-message',
      defaultMessage: 'I am a message with <strong>strong text</strong>',
    };

    const component = mountWithIntl(<FormattedXmlMessage {...message} />);

    expect(component.html()).toMatchSnapshot();
  });

  it('Maps XML tags to react-dom components', () => {

    const message = {
      id: 'test-message',
      defaultMessage: 'This text should be <italic>italic</italic>',
      tags: {
        italic: 'em',
      },
    };

    const component = mountWithIntl(<FormattedXmlMessage {...message} />);

    expect(component.html()).toMatchSnapshot();
  });

  it('Maps XML tags to custom react components', () => {

    function MyComponent(props) {
      return <em {...props} />;
    }

    const message = {
      id: 'test-message',
      defaultMessage: 'This text should be <italic>italic</italic>',
      tags: {
        italic: MyComponent,
      },
    };

    const component = mountWithIntl(<FormattedXmlMessage {...message} />);

    expect(component.html()).toMatchSnapshot();
  });

  it('Maps XML tags to custom react elements', () => {
    const message = {
      id: 'test-message',
      defaultMessage: 'Hey check out my <blog-link>blog</blog-link>!',
      tags: {
        'blog-link': <a href="https://my-blog.co.uk" />,
      },
    };

    const component = mountWithIntl(<FormattedXmlMessage {...message} />);

    expect(component.html()).toMatchSnapshot();
  });

  it('Merges XML and JSX attributes (Message takes precedence)', () => {
    const message = {
      id: 'test-message',
      defaultMessage: 'Hey check out my <blog-link href="https://my-blog.fr">blog</blog-link>!',
      tags: {
        'blog-link': <a href="https://example.com" rel="noopener noreferrer" />,
      },
    };

    const component = mountWithIntl(<FormattedXmlMessage {...message} />);

    expect(component.html()).toMatchSnapshot();
  });

  it('Does not parse XML contained in variables.', () => {
    const message = {
      id: 'test-message',
      defaultMessage: '<em>Hey</em> check out my {blog}, and click {clickLink}!',
      values: {
        blog: '<a href="https://malicious-website.com">Blog</a>',
        clickLink: <a href="https://text.com">Here</a>,
      },
    };

    const component = mountWithIntl(<FormattedXmlMessage {...message} />);

    expect(component.html()).toMatchSnapshot();
  });
});
