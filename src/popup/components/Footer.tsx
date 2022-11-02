import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const version = chrome.runtime.getManifest().version;

function Footer() {
  return (
    <Box>
      <Typography variant='body2' sx={{ float: 'left' }}>Jayahost - 2022</Typography>
      <Typography variant='body2' sx={{ float: 'right' }}>v{version}</Typography>
      <div style={{ clear: 'both' }}></div>
    </Box>
  );
}

export default Footer;
