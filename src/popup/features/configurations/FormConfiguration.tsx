import React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Alert from '@mui/material/Alert';
import { defaultSignature } from '../../../constants';

function FormConfiguration() {
  const [signature, setSignature] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<{
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success'
  } | null>(null);

  React.useEffect(() => {
    chrome.storage.local.get('signature', (data) => {
      if ('signature' in data) {
        setSignature(data.signature);
      } else {
        setSignature(defaultSignature);
      }
    });
  }, []);

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();

    setStatus(null);
    setLoading(true);
    chrome.storage.local.set({ signature }, () => {
      setLoading(false);

      setStatus({ message: 'Configuration changed!', severity: 'success' });
    });
  };

  const handleChangeSignature = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSignature(event.target.value);
  }

  return (
    <Box component='form' noValidate autoComplete='off' onSubmit={handleSubmit}>
      {(status !== null) && (
        <Alert severity={status.severity}>{status.message}</Alert>
      )}
      <TextField
        id="signature"
        label="Signature"
        multiline
        minRows={3}
        variant='outlined'
        margin="normal"
        fullWidth
        disabled={loading}
        onChange={handleChangeSignature}
        value={signature}
      />

      <FormControl margin='normal' fullWidth>
        <Button type="submit" variant='outlined' disabled={loading}>Save</Button>
      </FormControl>
    </Box>
  );
}

export default FormConfiguration;
