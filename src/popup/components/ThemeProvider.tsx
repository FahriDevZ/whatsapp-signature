import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (themeParam) => ({
        body: {
          backgroundColor: '#001e3c',
          width: 450,
          // minHeight: 300,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        },
      }),
    },
  },
});

export interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export default ThemeProvider;
