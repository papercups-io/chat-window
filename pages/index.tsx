import React from 'react';
import Head from 'next/head';
import {useRouter} from 'next/router';
import Widget from '../components/Widget';

export default function Home() {
  const {query} = useRouter();

  return (
    <>
      <Head>
        <title>{query.title || 'Welcome'}</title>
        <link rel="icon" href="/favicon.ico" />
        <base target="_parent _blank"></base>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />

        <script src="https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              cssVars({
                onlyLegacy: false,
                preserveVars: true,
                watch: true,
                variables: {
                  '--theme-ui-colors-text': '#141414',
                  '--theme-ui-colors-background': '#fff',
                  '--theme-ui-colors-primary': overrides.primary,
                  '--theme-ui-colors-darker': overrides.dark,
                  '--theme-ui-colors-lighter': overrides.light,
                  '--theme-ui-colors-secondary': '#722ed1',
                  '--theme-ui-colors-green': '#52c41a',
                  '--theme-ui-colors-muted': '#f0f0f0',
                  '--theme-ui-colors-gray': 'rgba(0, 0, 0, 0.45)',
                  '--theme-ui-colors-input': 'rgba(0, 0, 0, 0.65)',
                  '--theme-ui-colors-offset': 'rgba(255, 255, 255, 0.8)',
                  '--antd-wave-shadow-color': overrides.primary,
                  '--scroll-bar': '0',
                },
              })
            `,
          }}
        />
      </Head>

      {query.accountId ? <Widget config={query} /> : null}
    </>
  );
}
