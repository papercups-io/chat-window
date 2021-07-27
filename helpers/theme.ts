import tinycolor from 'tinycolor2';

type ThemeSettings = {primary?: string};

export const getThemeConfig = (settings: ThemeSettings) => {
  const {primary = '#1890ff'} = settings;
  const base = tinycolor(primary);
  const overrides = {
    primary: base.toString(),
    light: base.lighten().toString(),
    dark: base.darken().toString(),
  };

  return {
    useBodyStyles: false,
    space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
    fonts: {
      body:
        '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;',
      heading:
        '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;',
      monospace: '"Roboto Mono", monospace',
    },
    fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
    fontWeights: {
      body: 400,
      heading: 600,
      bold: 600,
    },
    lineHeights: {
      body: 1.5,
      heading: 1.125,
    },
    colors: {
      text: '#141414',
      background: '#fff',
      primary: overrides.primary,
      darker: overrides.dark,
      lighter: overrides.light,
      secondary: '#722ed1',
      green: '#52c41a',
      red: '#ff4d4f',
      muted: '#f0f0f0',
      gray: 'rgba(0, 0, 0, 0.45)',
      // TODO: come up with better names!
      input: 'rgba(0, 0, 0, 0.65)',
      offset: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      default: {
        color: 'text',
        fontSize: 1,
      },
      caps: {
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
      },
      heading: {
        fontFamily: 'heading',
        fontWeight: 'heading',
        lineHeight: 'heading',
      },
    },
    buttons: {
      primary: {
        cursor: 'pointer',
        outline: 0,
        transition: '0.2s',
        '&:hover': {
          background: overrides.light,
          borderColor: overrides.light,
        },
        '&:active': {
          background: overrides.dark,
          borderColor: overrides.dark,
        },
      },
      secondary: {
        cursor: 'pointer',
        outline: 0,
        transition: '0.2s',
        // background: 'transparent',
        background: base.lighten(40).toString(),
        color: overrides.primary,
        borderColor: overrides.primary,
        borderWidth: 1,
        borderStyle: 'solid',
        '&:hover': {
          color: '#fff',
          background: overrides.primary,
          borderColor: overrides.primary,
        },
        '&:active': {
          background: overrides.dark,
          borderColor: overrides.dark,
        },
      },
      link: {
        cursor: 'pointer',
        outline: 0,
        transition: '0.2s',
        backgroundColor: 'background',
        '&:hover': {
          backgroundColor: 'offset',
          borderColor: 'offset',
        },
        '&:active': {
          backgroundColor: 'offset',
          borderColor: 'offset',
        },
      },
    },
    styles: {
      root: {
        fontFamily: 'body',
        lineHeight: 'body',
        fontWeight: 'body',
        fontSize: 1,
      },
      h1: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 5,
      },
      h2: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 4,
      },
      h3: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 3,
      },
      h4: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 2,
      },
      h5: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 1,
      },
      h6: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 0,
      },
      p: {
        color: 'text',
        fontFamily: 'body',
        fontWeight: 'body',
        lineHeight: 'body',
      },
      a: {
        color: 'primary',
        userSelect: 'none',
        '&:hover': {
          color: overrides.light,
        },
        '&:active': {
          color: overrides.dark,
        },
      },
      pre: {
        fontFamily: 'monospace',
        overflowX: 'auto',
        code: {
          color: 'inherit',
        },
      },
      code: {
        fontFamily: 'monospace',
        fontSize: 'inherit',
      },
      table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
      th: {
        textAlign: 'left',
        borderBottomStyle: 'solid',
      },
      td: {
        textAlign: 'left',
        borderBottomStyle: 'solid',
      },
      img: {
        maxWidth: '100%',
      },
      input: {
        transparent: {
          border: 'none',
          boxShadow: 'none',
          resize: 'none',
          outline: 0,
          '&:hover': {
            border: 'none',
            boxShadow: 'none',
            resize: 'none',
            outline: 0,
          },
          '&:active': {
            border: 'none',
            boxShadow: 'none',
            resize: 'none',
            outline: 0,
          },
          '&:focus': {
            border: 'none',
            boxShadow: 'none',
            resize: 'none',
            outline: 0,
          },
          '&:disabled': {
            opacity: 0.8,
            cursor: 'not-allowed',
          },
        },
      },
      WidgetContainer: {
        margin: 0,
        zIndex: 2147483000,
        position: 'fixed',
        bottom: 100,
        right: 20,
        width: 376,
        maxWidth: ['90%', '376px'],
        minHeight: 250,
        maxHeight: ['60%', '704px'],
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 5px 40px',
        height: 'calc(100% - 120px)',
        borderRadius: 8,
        overflow: 'hidden',
      },
      WidgetToggleContainer: {
        position: 'fixed',
        zIndex: 2147483003,
        bottom: '20px',
        right: '20px',
      },
      WidgetToggle: {
        outline: 'none',
        border: 'none',
        userSelect: 'none',
        cursor: 'pointer',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },
  };
};

export default getThemeConfig;
