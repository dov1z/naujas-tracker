const BOT_TOKEN = '8472507341:AAE4BmTUt7sOpovwsmLtl4IltNhBlHithzc';
const CHAT_ID = '2143061691';

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

function extractName(emailOrName) {
  if (emailOrName.includes('@')) {
    return emailOrName.split('@')[0].replace(/\./g, ' ').replace(/_/g, ' ');
  }
  return emailOrName;
}

function detectDevice(userAgent, referer) {
  const ua = userAgent.toLowerCase();
  const ref = referer.toLowerCase();

  const isGoogleProxy = ua.includes('googleimageproxy') || ua.includes('ggpht.com');
  const isGmailWeb = ref.includes('mail.google.com');

  if (isGoogleProxy && isGmailWeb) return 'WEB';
  if (isGoogleProxy && !isGmailWeb) return 'Telefonas';
  if (isGmailWeb) return 'WEB';
  return 'Nežinomas';
}

module.exports = async (req, res) => {
  try {
    const {
      id = 'no-id',
      createdAt = '',
      recipient = 'nežinomas',
      recipientName = '',
      subject = 'be temos',
      siuntejas = 'nežinomas'
    } = req.query;

    const headers = req.headers;
    const userAgent = headers['user-agent'] || 'no-agent';
    const referer = headers['referer'] || '';

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

    if (headers['x-forwarded-for'] === tavoIP) {
      message = `📤 Laiškas išsiųstas\n\n🆔 ID: ${id}`;
    } else {
      const deviceType = detectDevice(userAgent, referer);

      let statusLine = '';
      if (!referer) {
        statusLine = `🎉 *LAIŠKAS ATIDARYTAS* 🎉`;
      } else if (referer.includes('mail.google.com')) {
        statusLine = `*LAIŠKAS PRISTATYTAS*`;
      } else {
        statusLine = `*LAIŠKO BŪSENA NEŽINOMA*`;
      }

      message = `${statusLine}\n\n⏱️ Po: ${timeDiffText}\n🆔 ID: ${id}\n\n📄 Tema: ${decodeURIComponent(subject)}\n👤 Gavėjas: ${recipientName ? `${recipientName} (${recipient})` : recipient}\n✉️ Siuntėjas: ${extractName(siuntejas)}\n📤 Išsiųsta: ${formatDate(sentAt)}\n📥 Atidaryta: ${formatDate(openedAt)}\n\n📱 Įrenginys: ${deviceType}`;
    }

    console.log('📨 Telegram žinutė:', message);

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    console.log('📦 Telegram atsakymas:', result);

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(pixel);
  } catch (err) {
    console.error('❌ Klaida funkcijoje:', err);
    res.status(500).send('Serverio klaida');
  }
};
