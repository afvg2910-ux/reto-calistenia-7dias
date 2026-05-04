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
const cron       = require('node-cron');

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

  <!-- FOOTER NOTE -->
  <tr><td style="background:#1a1a1a;padding:16px 32px 24px;text-align:center">
    <p style="color:#444;font-size:12px;margin:0">Sin spam. Solo 7 emails en 7 días.</p>
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

// ─── EMAIL FUNNEL — corre cada día a las 9am UTC ──────────────────────────────

const DAY_EMAILS = {
  1: { subject: '🔥 Día 1 — Tu reto de calistenia empieza HOY',       color: '#FF6B00', ejercicio: 'FLEXIONES',      serie: '3 series × 10 flexiones',      tip: 'Codos a 45°. Pecho al suelo. Espalda recta.', siguiente: 'Sentadillas', img: '01' },
  2: { subject: '💪 Día 2 — Hoy trabajan las piernas',                color: '#00C8FF', ejercicio: 'SENTADILLAS',    serie: '3 series × 15 sentadillas',     tip: 'Rodillas no pasan los pies. Baja hasta muslos paralelos.', siguiente: 'Fondos en silla', img: '02' },
  3: { subject: '🦾 Día 3 — Tríceps y hombros',                       color: '#00FF88', ejercicio: 'FONDOS EN SILLA', serie: '3 series × 12 fondos',         tip: 'Pies más lejos = más difícil. Ajusta según tu nivel.', siguiente: 'Plancha', img: '03' },
  4: { subject: '🧱 Día 4 — El reto del core',                        color: '#FF2255', ejercicio: 'PLANCHA',         serie: '3 series × 45 segundos',       tip: 'Cuerpo recto. Aprieta el abdomen. Aguanta 5 seg más.', siguiente: 'Zancadas', img: '04' },
  5: { subject: '⚡ Día 5 — Equilibrio y fuerza funcional',           color: '#FFDD00', ejercicio: 'ZANCADAS',        serie: '3 series × 12 por pierna',     tip: 'Rodilla trasera casi al suelo. Torso recto.', siguiente: 'Burpees', img: '05' },
  6: { subject: '🔥 Día 6 — El ejercicio más completo que existe',    color: '#BB44FF', ejercicio: 'BURPEES',         serie: '3 series × 8 burpees',         tip: 'Calidad sobre velocidad. Cada rep completa vale más.', siguiente: 'Reto final', img: '06' },
  7: { subject: '🏆 Día 7 — Hoy lo das TODO. Reto Final.',            color: '#FFDD00', ejercicio: 'RETO FINAL',      serie: 'Circuito completo sin descanso', tip: '¡Lo lograste! Comparte tu resultado.', siguiente: null, img: '07' },
};

function dayEmailHtml(d) {
  const IMG = 'https://reto-calistenia.netlify.app/images';
  const e = DAY_EMAILS[d];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
  <tr><td style="background:${e.color};padding:28px 32px;text-align:center;border-radius:12px 12px 0 0">
    <p style="margin:0;color:rgba(0,0,0,0.6);font-size:13px;font-weight:bold">RETO CALISTENIA 7 DÍAS</p>
    <h1 style="margin:8px 0 0;color:black;font-size:30px">DÍA ${d} — ${e.ejercicio}</h1>
  </td></tr>
  <tr><td style="background:#222;padding:0">
    <img src="${IMG}/dia_${e.img}_img_1.jpg" width="600" style="display:block;width:100%">
  </td></tr>
  <tr><td style="background:#1a1a1a;padding:28px 32px">
    <p style="color:${e.color};font-size:26px;font-weight:bold;margin:0 0 8px;text-align:center">${e.serie}</p>
    <p style="color:#ccc;font-size:15px;text-align:center;margin:0 0 24px">${e.tip}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px"><tr>
      <td style="padding:4px"><img src="${IMG}/dia_${e.img}_img_2.jpg" width="100%" style="border-radius:6px;display:block"></td>
      <td style="padding:4px"><img src="${IMG}/dia_${e.img}_img_3.jpg" width="100%" style="border-radius:6px;display:block"></td>
      <td style="padding:4px"><img src="${IMG}/dia_${e.img}_img_4.jpg" width="100%" style="border-radius:6px;display:block"></td>
    </tr></table>
    ${e.siguiente ? `<p style="color:#555;font-size:13px;text-align:center;margin:16px 0 0">Mañana: <strong style="color:#aaa">${e.siguiente}</strong></p>` : ''}
  </td></tr>
  <tr><td style="background:#0a0a0a;padding:16px;text-align:center;border-radius:0 0 12px 12px">
    <p style="color:#333;font-size:12px;margin:0">© 2026 Reto Calistenia 7 Días</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

async function runFunnel() {
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(SUBS, 'utf8')); } catch (_) { return; }
  const today = new Date();
  let sent = 0;

  for (const sub of subs) {
    if (sub.completed) continue;
    const diffDays = Math.floor((today - new Date(sub.registeredAt)) / 86400000) + 1;
    const day = Math.min(diffDays, 7);
    if (sub.lastDaySent >= day) continue;
    try {
      await sendBrevoEmail(sub.email, DAY_EMAILS[day].subject, dayEmailHtml(day));
      sub.lastDaySent = day;
      if (day === 7) sub.completed = true;
      console.log(`Funnel OK  ${sub.email} → Día ${day}`);
      sent++;
    } catch (err) {
      console.error(`Funnel ERR ${sub.email}: ${err.message}`);
    }
  }

  fs.writeFileSync(SUBS, JSON.stringify(subs, null, 2));
  if (sent > 0) console.log(`Funnel: ${sent} emails enviados`);
}

// Corre cada día a las 9am UTC (5am hora Colombia)
cron.schedule('0 9 * * *', () => {
  console.log('Cron: ejecutando funnel...');
  runFunnel();
});
