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
      </Head>

      {query.accountId ? <Widget config={query} /> : null}
    </>
  );
}
