const localtunnel = require('localtunnel');

const PORT = 3000;
const SUBDOMAIN = 'foodback-permanent-system';

async function startTunnel() {
  console.log('Attempting to start permanent tunnel...');
  try {
    const tunnel = await localtunnel({ 
      port: PORT, 
      subdomain: SUBDOMAIN,
      local_host: '127.0.0.1' 
    });

    if (tunnel.url !== \https://\.loca.lt\) {
      console.log('Got wrong subdomain:', tunnel.url);
      console.log('Subdomain currently locked. Retrying in 5 seconds...');
      tunnel.close();
      setTimeout(startTunnel, 5000);
      return;
    }

    console.log('SUCCESS! Permanent URL is live at:', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed unexpectedly! Reconnecting...');
      setTimeout(startTunnel, 1000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });

  } catch (err) {
    console.error('Failed to start tunnel:', err);
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
