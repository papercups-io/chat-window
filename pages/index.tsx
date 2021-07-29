import React from 'react';
import Head from 'next/head';
import {useRouter} from 'next/router';
import Widget from '../components/Widget';

export default function Home(): JSX.Element {
  const {query} = useRouter();

  return (
    <>
      <Head>
        <title>{query.title || 'Welcome'}</title>
        <link rel="icon" href="/favicon.ico" />
        <base target="_parent _blank"></base>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      {query.accountId ? <Widget config={query} /> : null}
    </>
  );
}
