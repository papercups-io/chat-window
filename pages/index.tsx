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
              })
            `,
          }}
        />
      </Head>

      {query.accountId ? <Widget config={query} /> : null}
    </>
  );
}
