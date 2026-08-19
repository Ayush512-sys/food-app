const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const desktopPath = 'C:\\Users\\MB540WS\\Downloads\\Food App Management\\Live_App_Link.txt';

function startTunnel() {
  console.log('Starting Cloudflare tunnel...');
  const cloudflared = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://127.0.0.1:5001'], {
    env: { ...process.env, TUNNEL_PROTOCOL: 'http2' },
    shell: true
  });

  let buffer = '';
  cloudflared.stderr.on('data', (data) => {
    const text = data.toString();
    // PM2 captures this in its logs
    process.stderr.write(data);
    buffer += text;
    
    // Look for trycloudflare.com URL
    const match = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) {
      const url = match[0];
      const content = `Your Food App is live at this link:\n\n${url}\n\n(Last updated: ${new Date().toLocaleString()})\n\nNote: Because this is a free connection, the URL changes whenever your computer sleeps or restarts. Just open this file to get the latest working link!`;
      
      try {
        fs.writeFileSync(desktopPath, content);
        console.log(`Wrote new URL to ${desktopPath}`);
        buffer = ''; // clear buffer so we don't rewrite it on every chunk
      } catch (e) {
        console.error('Failed to write to desktop:', e.message);
      }
    }

    // Check if cloudflared encountered a connection error (e.g. PC woke from sleep)
    if (text.includes('control stream encountered a failure while serving') || text.includes('context canceled') || text.includes('Retrying connection')) {
      console.log('Tunnel connection failed or got stuck. Restarting cloudflared...');
      spawn('taskkill', ['/F', '/IM', 'cloudflared.exe', '/T']);
      cloudflared.kill();
    }
  });

  cloudflared.on('close', (code) => {
    console.log(`Cloudflare process exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
