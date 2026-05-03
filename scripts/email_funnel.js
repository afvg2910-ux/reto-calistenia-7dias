/**
 * Email funnel automático — Reto Calistenia 7 Días
 *
 * Envía el email del día correspondiente a cada suscriptor.
 * Ejecutar diariamente con cron o manualmente: node scripts/email_funnel.js
 *
 * Prerequisitos:
 *   - Gmail App Password en .env (GMAIL_USER + GMAIL_PASS)
 *   - npm install nodemailer dotenv
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const fs         = require('path');
const fss        = require('fs');
const path       = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const SUBS_FILE = path.join(DATA_DIR, 'subscribers.json');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const emails = {
  1: {
    subject: '🔥 Día 1 — Tu reto de calistenia empieza HOY',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#FF6B00;font-size:32px;margin-bottom:8px">DÍA 1 — FLEXIONES</h1>
        <p style="color:#aaa;font-size:14px;margin-top:0">Reto Calistenia 7 Días</p>
        <hr style="border-color:#FF6B00;margin:24px 0">
        <h2 style="font-size:20px">Hoy haces:</h2>
        <p style="font-size:28px;font-weight:bold;color:#FF6B00">3 series × 10 flexiones</p>
        <p style="color:#ccc">Codos a 45°. Pecho al suelo. Espalda recta todo el tiempo.</p>
        <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:24px 0;border-left:4px solid #FF6B00">
          <strong>Tip del día:</strong><br>
          Si no llegas a 10, haz las que puedas. Lo importante es empezar.
        </div>
        <p style="color:#888">Mañana: <strong style="color:white">Sentadillas</strong></p>
      </div>`,
  },
  2: {
    subject: '💪 Día 2 — Hoy trabajan las piernas',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#050510;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#00C8FF;font-size:32px;margin-bottom:8px">DÍA 2 — SENTADILLAS</h1>
        <p style="color:#aaa;font-size:14px;margin-top:0">Reto Calistenia 7 Días</p>
        <hr style="border-color:#00C8FF;margin:24px 0">
        <h2 style="font-size:20px">Hoy haces:</h2>
        <p style="font-size:28px;font-weight:bold;color:#00C8FF">3 series × 15 sentadillas</p>
        <p style="color:#ccc">Rodillas no pasan los pies. Baja hasta muslos paralelos al suelo.</p>
        <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:24px 0;border-left:4px solid #00C8FF">
          <strong>Tip del día:</strong><br>
          Activa el glúteo al subir. Imagina que pisas el suelo con fuerza.
        </div>
        <p style="color:#888">Mañana: <strong style="color:white">Fondos en silla</strong></p>
      </div>`,
  },
  3: {
    subject: '🦾 Día 3 — Tríceps y hombros',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#00FF88;font-size:32px;margin-bottom:8px">DÍA 3 — FONDOS EN SILLA</h1>
        <p style="color:#aaa;font-size:14px;margin-top:0">Reto Calistenia 7 Días</p>
        <hr style="border-color:#00FF88;margin:24px 0">
        <h2 style="font-size:20px">Hoy haces:</h2>
        <p style="font-size:28px;font-weight:bold;color:#00FF88">3 series × 12 fondos</p>
        <p style="color:#ccc">Usa una silla o banco. Codo a 90° al bajar.</p>
        <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:24px 0;border-left:4px solid #00FF88">
          <strong>Tip del día:</strong><br>
          Pies más lejos = más difícil. Ajusta la distancia según tu nivel.
        </div>
        <p style="color:#888">Mañana: <strong style="color:white">Plancha (core)</strong></p>
      </div>`,
  },
  4: {
    subject: '🧱 Día 4 — El reto del core',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#10050a;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#FF2255;font-size:32px;margin-bottom:8px">DÍA 4 — PLANCHA</h1>
        <p style="color:#aaa;font-size:14px;margin-top:0">Reto Calistenia 7 Días</p>
        <hr style="border-color:#FF2255;margin:24px 0">
        <h2 style="font-size:20px">Hoy haces:</h2>
        <p style="font-size:28px;font-weight:bold;color:#FF2255">3 series × 45 segundos</p>
        <p style="color:#ccc">Cuerpo recto. Aprieta el abdomen. Respira despacio.</p>
        <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:24px 0;border-left:4px solid #FF2255">
          <strong>Tip del día:</strong><br>
          Si tiemblas, es buena señal. Aguanta 5 segundos más de lo que crees.
        </div>
        <p style="color:#888">Mañana: <strong style="color:white">Zancadas</strong></p>
      </div>`,
  },
  5: {
    subject: '⚡ Día 5 — Equilibrio y fuerza funcional',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#05100a;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#FFDD00;font-size:32px;margin-bottom:8px">DÍA 5 — ZANCADAS</h1>
        <p style="color:#aaa;font-size:14px;margin-top:0">Reto Calistenia 7 Días</p>
        <hr style="border-color:#FFDD00;margin:24px 0">
        <h2 style="font-size:20px">Hoy haces:</h2>
        <p style="font-size:28px;font-weight:bold;color:#FFDD00">3 series × 12 por pierna</p>
        <p style="color:#ccc">Rodilla trasera casi al suelo. Alterna piernas.</p>
        <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:24px 0;border-left:4px solid #FFDD00">
          <strong>Tip del día:</strong><br>
          Mantén el torso recto. No dejes que la rodilla delantera se vaya hacia adentro.
        </div>
        <p style="color:#888">Mañana: <strong style="color:white">Burpees — el más duro</strong></p>
      </div>`,
  },
  6: {
    subject: '🔥 Día 6 — El ejercicio más completo que existe',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#050505;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#BB44FF;font-size:32px;margin-bottom:8px">DÍA 6 — BURPEES</h1>
        <p style="color:#aaa;font-size:14px;margin-top:0">Reto Calistenia 7 Días</p>
        <hr style="border-color:#BB44FF;margin:24px 0">
        <h2 style="font-size:20px">Hoy haces:</h2>
        <p style="font-size:28px;font-weight:bold;color:#BB44FF">3 series × 8 burpees</p>
        <p style="color:#ccc">De pie → suelo → flexión → salta → palmea arriba.</p>
        <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:24px 0;border-left:4px solid #BB44FF">
          <strong>Tip del día:</strong><br>
          Calidad sobre velocidad. Cada rep completa vale más que 3 a medias.
        </div>
        <p style="color:#888">Mañana: <strong style="color:white">RETO FINAL — circuito completo</strong></p>
      </div>`,
  },
  7: {
    subject: '🏆 Día 7 — Hoy lo das TODO. Reto Final.',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0a0500;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#FFDD00;font-size:32px;margin-bottom:8px">DÍA 7 — RETO FINAL</h1>
        <p style="color:#aaa;font-size:14px;margin-top:0">Reto Calistenia 7 Días</p>
        <hr style="border-color:#FF6B00;margin:24px 0">
        <h2 style="font-size:20px">Circuito completo (sin descanso):</h2>
        <ul style="color:#ccc;font-size:18px;line-height:2">
          <li><strong style="color:#FF6B00">10</strong> Flexiones</li>
          <li><strong style="color:#00C8FF">15</strong> Sentadillas</li>
          <li><strong style="color:#00FF88">12</strong> Fondos en silla</li>
          <li><strong style="color:#FF2255">45s</strong> Plancha</li>
          <li><strong style="color:#FFDD00">12</strong> Zancadas por pierna</li>
          <li><strong style="color:#BB44FF">8</strong> Burpees</li>
        </ul>
        <div style="background:#FF6B00;padding:16px;border-radius:8px;margin:24px 0;text-align:center">
          <strong style="font-size:20px;color:black">¡COMPLETASTE EL RETO!</strong><br>
          <span style="color:#333">Comparte tu resultado. Te lo mereces.</span>
        </div>
      </div>`,
  },
};

async function sendDayEmail(email, day) {
  const template = emails[day];
  if (!template) throw new Error(`No hay template para el día ${day}`);

  await transporter.sendMail({
    from: `"Reto Calistenia" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

async function runFunnel() {
  const subs = JSON.parse(fss.readFileSync(SUBS_FILE, 'utf8'));
  const today = new Date();
  let sent = 0, skipped = 0;

  for (const sub of subs) {
    if (sub.completed) { skipped++; continue; }

    const registered = new Date(sub.registeredAt);
    const diffDays = Math.floor((today - registered) / 86400000) + 1;
    const day = Math.min(diffDays, 7);

    if (sub.lastDaySent >= day) { skipped++; continue; }

    try {
      await sendDayEmail(sub.email, day);
      sub.lastDaySent = day;
      if (day === 7) sub.completed = true;
      console.log(`OK  ${sub.email} → Día ${day}`);
      sent++;
    } catch (err) {
      console.error(`ERR ${sub.email}: ${err.message}`);
    }
  }

  fss.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
  console.log(`\n${sent} emails enviados | ${skipped} omitidos`);
}

runFunnel();
