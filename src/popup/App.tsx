import React from 'react';
import ThemeProvider from './components/ThemeProvider';
import FormConfiguration from './features/configurations/FormConfiguration';
import Box from '@mui/material/Box';
import Footer from './components/Footer';
import Header from './components/Header';

function App() {
  return (
    <ThemeProvider>
      <Box sx={(theme) => ({ padding: theme.spacing(2) })}>
        <Header />
        <FormConfiguration />
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
