import cssVars from 'css-vars-ponyfill';
import '../styles/global.css';

cssVars({
  onlyLegacy: false,
  preserveVars: true,
  watch: true,
  variables: {
    '--theme-ui-colors-text': '#141414',
    '--theme-ui-colors-background': '#fff',
    '--theme-ui-colors-primary': '#1890ff',
    '--theme-ui-colors-darker': '#1890ff',
    '--theme-ui-colors-lighter': '#1890ff',
    '--theme-ui-colors-secondary': '#722ed1',
    '--theme-ui-colors-green': '#52c41a',
    '--theme-ui-colors-muted': '#f0f0f0',
    '--theme-ui-colors-gray': 'rgba(0, 0, 0, 0.45)',
    '--theme-ui-colors-input': 'rgba(0, 0, 0, 0.65)',
    '--theme-ui-colors-offset': 'rgba(255, 255, 255, 0.8)',
  },
});

export default function App({Component, pageProps}) {
  return <Component {...pageProps} />;
}
