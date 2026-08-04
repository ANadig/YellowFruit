import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Alert, CircularProgress } from '@mui/material';
import { TournamentRoom } from '../../DataModel/TournamentRoom';

export default function RoomQr({ room, serverAddress }: { room: TournamentRoom; serverAddress: string }) {
  const url = serverAddress === '' ? '' : room.url(serverAddress);
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setDataUrl('');
    setError('');
    if (url === '') return undefined;

    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#18202a', light: '#ffffff' },
    })
      .then((nextUrl) => {
        if (!cancelled) setDataUrl(nextUrl);
        return nextUrl;
      })
      .catch(() => {
        if (!cancelled) setError('Could not generate the QR code. Copy the room URL instead.');
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (url === '')
    return <Alert severity="info">Start the Tournament Server to generate a reachable room QR code.</Alert>;
  if (error !== '') return <Alert severity="warning">{error}</Alert>;
  if (dataUrl === '') return <CircularProgress size={24} aria-label="Generating QR code" />;

  return <img src={dataUrl} alt={`QR code for ${room.name}`} style={{ width: 220, height: 220 }} />;
}
