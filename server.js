/**
 * Servidor Express para capturar emails desde la landing page.
 * POST /subscribe → guarda en data/subscribers.json → envía email día 1
 * GET  /          → sirve index.html
 *
 * Uso: npm install && node server.js
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const https      = require('https');

const app     = express();
const PORT    = process.env.PORT || 3000;
const SUBS    = path.join(__dirname, 'data/subscribers.json');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors());
app.use(express.json());
app.use(express.static(__dirname));

function sendBrevoEmail(to, subject, html) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender: { name: 'Reto Calistenia', email: 'afvg2910@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => res.statusCode < 300 ? resolve(data) : reject(new Error(`Brevo ${res.statusCode}: ${data}`)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

app.post('/subscribe', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Cargar y actualizar subscribers
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(SUBS, 'utf8')); } catch (_) {}

  if (subs.find(s => s.email === email)) {
    return res.status(409).json({ error: 'Ya estás registrado' });
  }

  const sub = {
    email,
    name: name || '',
    registeredAt: new Date().toISOString(),
    lastDaySent: 0,
    completed: false,
  };
  subs.push(sub);
  fs.writeFileSync(SUBS, JSON.stringify(subs, null, 2));

  // Enviar email de bienvenida + Día 1
  try {
    const IMG = 'https://reto-calistenia.netlify.app/images';
    await sendBrevoEmail(email, '🔥 ¡Estás dentro! Reto Calistenia 7 Días', `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- HEADER -->
  <tr><td style="background:#FF6B00;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="margin:0;color:white;font-size:28px;letter-spacing:2px">RETO CALISTENIA 7 DÍAS</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px">¡Bienvenido${name ? ', ' + name : ''}! Ya eres parte del reto.</p>
  </td></tr>

  <!-- INTRO -->
  <tr><td style="background:#1a1a1a;padding:24px 32px">
    <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0">
      Durante los próximos <strong style="color:white">7 días</strong> recibirás tu entrenamiento diario.<br>
      Sin gym. Sin equipo. <strong style="color:#FF6B00">Solo tu cuerpo y 15 minutos.</strong>
    </p>
  </td></tr>

  <!-- DIA 1 DESTACADO -->
  <tr><td style="background:#222;padding:24px 32px">
    <p style="color:#FF6B00;font-size:12px;font-weight:bold;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">Mañana empieza — Día 1</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="180" style="padding-right:16px;vertical-align:top">
        <img src="${IMG}/dia_01_img_1.jpg" width="180" style="border-radius:8px;display:block;width:100%">
      </td>
      <td style="vertical-align:top">
        <h2 style="color:white;margin:0 0 8px;font-size:20px">Pecho y Tríceps</h2>
        <p style="color:#aaa;font-size:14px;margin:0 0 16px;line-height:1.6">Flexiones básicas y avanzadas. Trabaja pecho, tríceps y core en un solo movimiento.</p>
        <p style="color:#ccc;font-size:13px;margin:0">✅ 3 series × 12 repeticiones<br>✅ Sin equipamiento<br>✅ 15 minutos</p>
      </td>
    </tr></table>
    <!-- 4 slides del día 1 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px"><tr>
      <td width="25%" style="padding:4px"><img src="${IMG}/dia_01_img_1.jpg" width="100%" style="border-radius:6px;display:block"></td>
      <td width="25%" style="padding:4px"><img src="${IMG}/dia_01_img_2.jpg" width="100%" style="border-radius:6px;display:block"></td>
      <td width="25%" style="padding:4px"><img src="${IMG}/dia_01_img_3.jpg" width="100%" style="border-radius:6px;display:block"></td>
      <td width="25%" style="padding:4px"><img src="${IMG}/dia_01_img_4.jpg" width="100%" style="border-radius:6px;display:block"></td>
    </tr></table>
  </td></tr>

  <!-- PREVIEW DIAS 2-7 -->
  <tr><td style="background:#1a1a1a;padding:24px 32px">
    <p style="color:#FF6B00;font-size:12px;font-weight:bold;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px">Tu programa completo:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['02','Espalda y Bíceps'],
        ['03','Piernas y Glúteos'],
        ['04','Hombros y Core'],
        ['05','Full Body Cardio'],
        ['06','Consolidación'],
        ['07','Descanso Activo'],
      ].map(([d, title]) => `
      <tr>
        <td width="60" style="padding:4px 8px 4px 0;vertical-align:middle">
          <img src="${IMG}/dia_${d}_img_1.jpg" width="56" height="56" style="border-radius:6px;display:block;object-fit:cover">
        </td>
        <td style="vertical-align:middle;border-bottom:1px solid #333;padding:8px 0">
          <span style="color:#888;font-size:11px">DÍA ${parseInt(d)}</span><br>
          <span style="color:#ddd;font-size:14px;font-weight:bold">${title}</span>
        </td>
      </tr>`).join('')}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#1a1a1a;padding:16px 32px 32px;text-align:center">
    <a href="https://reto-calistenia-7dias-production.up.railway.app" style="background:#FF6B00;color:white;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block">
      VER EL RETO COMPLETO →
    </a>
    <p style="color:#444;font-size:12px;margin:20px 0 0">Sin spam. Solo 7 emails en 7 días.</p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0a0a0a;padding:16px;text-align:center;border-radius:0 0 12px 12px">
    <p style="color:#333;font-size:12px;margin:0">© 2026 Reto Calistenia 7 Días</p>
  </td></tr>

</table></td></tr></table>
</body></html>`
    );
    sub.lastDaySent = 0;
    fs.writeFileSync(SUBS, JSON.stringify(subs, null, 2));
  } catch (err) {
    console.error('Email error:', err.message);
  }

  res.json({ ok: true, message: 'Registro exitoso. Revisa tu email.' });
});

app.get('/subscribers', (req, res) => {
  try {
    const subs = JSON.parse(fs.readFileSync(SUBS, 'utf8'));
    res.json({ total: subs.length, completed: subs.filter(s => s.completed).length });
  } catch (_) {
    res.json({ total: 0, completed: 0 });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
