import cssVars from 'css-vars-ponyfill';
import '../styles/global.css';

cssVars({
  onlyLegacy: false,
  preserveVars: true,
  watch: true,
});

export default function App({Component, pageProps}) {
  return <Component {...pageProps} />;
}
