import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

function Header() {
  const [disableRefreshPage, setDisableRefreshPage] = React.useState<boolean>(false);

  const handleRefreshPage = () => {
    setDisableRefreshPage(true);
    chrome.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
      const promises = tabs.filter(tab => tab.id !== null && !tab.discarded).map((tab) => {
        return chrome.tabs.discard(tab.id);
      });

      Promise.all(promises).finally(() => {
        setDisableRefreshPage(false);
      });
    });
  };

  return (
    <Box display='flex'>
      <Typography variant='h4' sx={{ marginBottom: 0 }}>Setting</Typography>
      <Button
        title="Refresh current tab"
        onClick={handleRefreshPage}
        disabled={disableRefreshPage}
      >
        Refresh page
      </Button>
    </Box>
  );
};

export default Header;
