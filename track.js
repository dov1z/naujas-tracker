const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// 🧠 Formatuoja datą pagal LT laiką
function formatDate(date) {
  return date.toLocaleString('lt-LT', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(',', '');
}

// 🧠 Ištraukia vardą iš el. pašto, jei reikia
function extractName(emailOrName) {
  if (emailOrName.includes('@')) {
    return emailOrName.split('@')[0].replace(/\./g, ' ').replace(/_/g, ' ');
  }
  return emailOrName;
}

app.get('/track', async (req, res) => {
  try {
    const {
      id = 'no-id',
      createdAt = '',
      recipient = 'nežinomas',
      recipientName = '',
      subject = 'be temos',
      siuntejas = 'nežinomas'
    } = req.query;

    const userAgent = req.headers['user-agent'] || 'no-agent';
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'no-ip';
    const referer = req.headers['referer'] || 'nėra';

    const openedAt = new Date();

    let sentAt;
    try {
      sentAt = new Date(createdAt);
      if (isNaN(sentAt.getTime())) throw new Error('Invalid date');
    } catch {
      sentAt = new Date(openedAt.getTime());
    }

    const diffMs = openedAt - sentAt;
    const diffSec = Math.floor(diffMs / 1000);
    const timeDiffText = `${Math.floor(diffSec / 60)} min${diffSec % 60 > 0 ? ` ${diffSec % 60} sek` : ''}`;

    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Zs9sAAAAASUVORK5CYII=',
      'base64'
    );

    const tavoIP = '84.15.176.207';
    let message = '';

    if (ip === tavoIP) {
      message =
`📤 Laiškas išsiųstas  
🆔 ID: ${id}`;
    } else {
      let statusLine = '';
      if (!referer || referer === 'nėra') {
        statusLine = `🎉 *LAIŠKAS ATIDARYTAS* 🎉`;
      } else if (referer.includes('mail.google.com')) {
        statusLine = `*LAIŠKAS PRISTATYTAS*`;
      } else {
        statusLine = `*LAIŠKO BŪSENA NEŽINOMA*`;
      }

      message =
`${statusLine}  
  
⏱️ Po: ${timeDiffText}  
🆔 ID: ${id}  
  
📄 Tema: ${decodeURIComponent(subject)}  
👤 Gavėjas: ${recipientName ? `${recipientName} (${recipient})` : recipient}  
✉️ Siuntėjas: ${extractName(siuntejas)}  
📤 Išsiųsta: ${formatDate(sentAt)}  
📥 Atidaryta: ${formatDate(openedAt)}`;
    }

    console.log('📨 Telegram žinutė:', message);

    await fetch(`https://api.telegram.org/bot8472507341:AAE4BmTUt7sOpovwsmLtl4IltNhBlHithzc/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: '2143061691',
        text: message,
        parse_mode: 'Markdown'
      })
    });

    console.log('✅ Telegram žinutė išsiųsta');

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(pixel);
  } catch (err) {
    console.error('❌ Klaida funkcijoje:', err);
    res.status(500).send('Serverio klaida');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveris veikia ant porto ${PORT}`);
});
