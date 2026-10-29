/* ══════════════════════════════════════════════════════
   NETWORKING IS KING — Diagnóstico K.I.N.G.
   assessment.js

   Quadrante baseado no livro de Cláudio Alcoforado.
   Eixo X = Intencionalidade do Relacionamento (Bloco A)
   Eixo Y = Postura Relacional (Bloco B)
   Escala: 6–30  |  Limiar: 18 (Baixa 6–17 / Alta 18–30)
   Quadrantes: Estratégico/Generoso · Relacional/Ingênuo · Utilitarista · Isolado

   Integrações (credenciais em config.js):
   - Supabase: salva lead + resultados completos ao concluir o quiz
══════════════════════════════════════════════════════ */

/* ─── PERGUNTAS ─── */
const QA = [
  'Planejo conscientemente com quem preciso manter relacionamento profissional',
  'Mantenho contato com pessoas relevantes mesmo quando não preciso de algo',
  'Sei explicar claramente quem sou profissionalmente e onde gero valor',
  'Uso eventos, projetos e reuniões como oportunidades de relacionamento',
  'Retomo contatos antigos de forma natural e consistente',
  'Tenho clareza de como meu networking se conecta aos meus objetivos'
];

const QB = [
  'Demonstro interesse genuíno pelas pessoas antes de falar de mim',
  'Compartilho informações, contatos ou oportunidades sem esperar retorno',
  'Ajudo pessoas mesmo quando não gera benefício direto',
  'Evito procurar pessoas apenas quando tenho uma necessidade',
  'Eu me preocupo com o impacto das minhas ações na confiança',
  'Sou lembrado como alguém que agrega valor'
];

const SCALE_FULL = [
  '', 'Discordo totalmente', 'Discordo parcialmente',
  'Nem concordo\nnem discordo', 'Concordo parcialmente', 'Concordo totalmente'
];

/* ─── QUADRANTES ─── */
const THRESHOLD = 18;

const Q = {
  sg: {
    key: 'sg',
    tag: '♛ A Atitude KING',
    name: 'Estratégico / Generoso',
    label: 'O perfil mais completo de networking',
    desc: 'Você age com intenção e gera valor genuíno para sua rede. Planeja conscientemente seus relacionamentos e, ao mesmo tempo, impacta positivamente quem está ao seu redor. Isso é a Atitude King, o perfil mais completo e poderoso do networking.',
    color: '#c9a84c'
  },
  ri: {
    key: 'ri',
    tag: 'Relacional',
    name: 'Relacional / Ingênuo',
    label: 'Generoso, mas pouco intencional',
    desc: 'Você se relaciona com autenticidade e gera impacto genuíno nas pessoas. Tem foco no outro e forte presença relacional. Para alcançar a Atitude King, desenvolva mais intencionalidade: planeje sua rede com clareza de propósito e objetivos.',
    color: '#f2f2f2'
  },
  ut: {
    key: 'ut',
    tag: 'Estratégico',
    name: 'Utilitarista',
    label: 'Intencional, mas pouco generoso',
    desc: 'Você tem clareza estratégica sobre sua rede e age com foco. Para alcançar a Atitude King, pratique a generosidade: compartilhe, ajude e construa confiança sem esperar retorno imediato. Networking real vai além da troca direta.',
    color: '#f2f2f2'
  },
  is: {
    key: 'is',
    tag: 'Em desenvolvimento',
    name: 'Isolado',
    label: 'Networking ainda em construção',
    desc: 'Você está no início da jornada do networking. Há um enorme espaço para crescimento nos dois eixos: intencionalidade e postura relacional. Este livro foi escrito exatamente para quem quer construir uma rede sólida e autêntica.',
    color: '#f2f2f2'
  }
};

/* ─── TEMPO DE CARREGAMENTO (anti-bot) ─── */
const _formLoadedAt = Date.now();

/* ─── PRE-LOAD IMAGES FOR CHART STRIP ─── */
let _imgBookCover = null;
let _imgAuthor    = null;
let _imgCrown     = null;
/* Quando tiver a coroa 3D da capa em PNG transparente, salve em img/crown.png e troque null por '../img/crown.png' */
const CROWN_SRC = null;

function _loadImg(src) {
  return new Promise(res => {
    const img = new Image();
    img.onload  = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

async function preloadChartImages() {
  [_imgBookCover, _imgAuthor, _imgCrown] = await Promise.all([
    _loadImg('../img/book-cover.jpg?v=20261029'),
    _loadImg('../img/author-claudio.png?v=20261028'),
    CROWN_SRC ? _loadImg(CROWN_SRC) : Promise.resolve(null)
  ]);
}
const _imagesReady = preloadChartImages();
const _fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
function whenAssetsReady(fn) { Promise.all([_imagesReady, _fontsReady]).then(fn, fn); }

function _drawQR(ctx, x, y, size, url) {
  if (typeof qrcode === 'undefined') return;
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const count = qr.getModuleCount();
    const cell  = size / count;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
      }
    }
  } catch (_) {}
}

function _getImgDataURL(img) {
  if (!img) return null;
  try {
    const c = document.createElement('canvas');
    c.width  = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/jpeg', 0.75);
  } catch (_) { return null; }
}

/* ─── evitar salvar o mesmo lead duas vezes na mesma sessão ─── */
const _savedLeads = new Set();

/* ─── ESTADO ─── */
const state = {
  step: 1,
  user: {},
  answers: { a: new Array(6).fill(0), b: new Array(6).fill(0) },
  scores: { a: 0, b: 0 },
  quadrant: null
};

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initSupabase === 'function') initSupabase();
  renderQuestions();
  bindStep1();
  bindStep2();
  bindStep3();
  bindStep4();

  const wppInput = document.getElementById('f-whatsapp');
  if (wppInput) {
    wppInput.addEventListener('input', function () {
      this.value = KingLogic.formatWhatsapp(this.value);
    });
  }
});

/* ─── NAVEGAÇÃO ENTRE PASSOS ─── */
function goToStep(n) {
  document.querySelector('.a-step.active')?.classList.remove('active');
  document.getElementById(`step-${n}`).classList.add('active');

  document.querySelectorAll('.a-dot').forEach(dot => {
    const s = +dot.dataset.step;
    dot.classList.remove('active', 'done');
    if (s === n) dot.classList.add('active');
    else if (s < n) dot.classList.add('done');
  });

  state.step = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════
   PASSO 2 — RENDERIZAR PERGUNTAS
══════════════════════════════════ */
function renderQuestions() {
  const LABELS = ['', 'Discordo\ntotalmente', 'Discordo\nparcialmente', 'Neutro', 'Concordo\nparcialmente', 'Concordo\ntotalmente'];

  function makeBlock(questions, block, start) {
    return questions.map((text, i) => {
      const num = start + i;
      const nm = `q${block}${i}`;
      const opts = [1,2,3,4,5].map(v => `
        <div class="likert-opt">
          <input type="radio" id="${nm}_${v}" name="${nm}" value="${v}" />
          <label for="${nm}_${v}">${v}<span class="l-lbl">${LABELS[v].replace('\n', '<br>')}</span></label>
        </div>`).join('');
      return `
        <div class="q-item" data-block="${block}" data-idx="${i}">
          <div class="q-text">
            <span class="q-num">${num}</span>
            <span>${text}</span>
          </div>
          <div class="likert" role="group" aria-label="Resposta à pergunta ${num}">${opts}</div>
        </div>`;
    }).join('');
  }

  document.getElementById('q-block-a').innerHTML = makeBlock(QA, 'a', 1);
  document.getElementById('q-block-b').innerHTML = makeBlock(QB, 'b', 7);
}

/* ══════════════════════════════════
   PASSO 1 — CADASTRO
══════════════════════════════════ */
function bindStep1() {
  document.getElementById('reg-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateReg()) return;

    state.user = {
      name:     document.getElementById('f-name').value.trim(),
      email:    document.getElementById('f-email').value.trim(),
      whatsapp: document.getElementById('f-whatsapp').value.trim(),
      city:     document.getElementById('f-city').value.trim(),
      country:  document.getElementById('f-country').value.trim()
    };

    goToStep(2);
  });
}

function validateReg() {
  const name     = document.getElementById('f-name').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const whatsapp = document.getElementById('f-whatsapp').value.trim();
  const lgpd     = document.getElementById('f-lgpd').checked;
  const honey    = document.getElementById('reg-honey');

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const wppOk   = KingLogic.validatePhone(whatsapp);

  setErr('e-name',     !name     ? 'Por favor, informe seu nome.' : '');
  setErr('e-email',    !emailOk  ? 'Informe um email válido.' : '');
  setErr('e-whatsapp', !whatsapp ? 'Informe seu WhatsApp.' : (!wppOk ? 'Número inválido — mínimo 10 dígitos.' : ''));
  setErr('e-lgpd',     !lgpd     ? 'Você precisa aceitar os termos para continuar.' : '');

  // Honeypot: bots preenchem campo oculto
  if (honey && honey.value !== '') return false;
  // Tempo mínimo: envio em menos de 3s indica bot
  if (Date.now() - _formLoadedAt < 3000) return false;

  return !!(name && emailOk && wppOk && lgpd);
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

/* ══════════════════════════════════
   PASSO 2 — QUESTIONÁRIO
══════════════════════════════════ */
function updateQuizProgress() {
  const n = document.querySelectorAll('#quiz-form input[type="radio"]:checked').length;
  const fill = document.getElementById('quiz-fill');
  const count = document.getElementById('quiz-count');
  if (fill) fill.style.width = (n / 12 * 100) + '%';
  if (count) count.textContent = n + ' de 12';
  document.querySelectorAll('.q-item').forEach(item => {
    const done = !!item.querySelector('input:checked');
    item.classList.toggle('answered', done);
  });
}

function bindStep2() {
  document.getElementById('quiz-form').addEventListener('change', updateQuizProgress);
  document.getElementById('quiz-form').addEventListener('submit', e => {
    e.preventDefault();

    const { ok, answers } = collectAnswers();
    if (!ok) {
      document.getElementById('quiz-err').textContent =
        'Por favor, responda todas as 12 afirmações antes de continuar.';
      // scroll to first unanswered
      const firstItem = document.querySelector('.q-item');
      if (firstItem) {
        for (const item of document.querySelectorAll('.q-item')) {
          const block = item.dataset.block;
          const idx   = item.dataset.idx;
          const checked = document.querySelector(`input[name="q${block}${idx}"]:checked`);
          if (!checked) { item.scrollIntoView({ behavior: 'smooth', block: 'center' }); break; }
        }
      }
      return;
    }

    document.getElementById('quiz-err').textContent = '';
    state.answers = answers;
    state.scores  = {
      a: KingLogic.sumAnswers(answers.a),
      b: KingLogic.sumAnswers(answers.b)
    };
    state.quadrant = getQuadrant(state.scores.a, state.scores.b);

    // Salva no Supabase em segundo plano — evita duplicata na mesma sessão
    const _emailKey = state.user.email.toLowerCase();
    if (typeof saveLead === 'function' && !_savedLeads.has(_emailKey)) {
      _savedLeads.add(_emailKey);
      saveLead(KingLogic.buildAssessmentLead(state.user, state.quadrant, state.scores, answers));
    }

    buildResults();
    goToStep(3);
  });
}

function collectAnswers() {
  const answers = { a: [], b: [] };
  let ok = true;

  QA.forEach((_, i) => {
    const el = document.querySelector(`input[name="qa${i}"]:checked`);
    if (!el) ok = false;
    answers.a.push(el ? +el.value : 0);
  });

  QB.forEach((_, i) => {
    const el = document.querySelector(`input[name="qb${i}"]:checked`);
    if (!el) ok = false;
    answers.b.push(el ? +el.value : 0);
  });

  return { ok, answers };
}

function getQuadrant(a, b) {
  return Q[KingLogic.getQuadrantKey(a, b)];
}

/* ══════════════════════════════════
   PASSO 3 — RESULTADO + GRÁFICO
══════════════════════════════════ */
function buildResults() {
  const { quadrant: qd, scores: { a, b }, user } = state;

  document.getElementById('res-tag').textContent   = qd.tag;
  document.getElementById('res-name').textContent  = qd.name;
  document.getElementById('res-name').style.color  = qd.color;
  document.getElementById('res-label').textContent = qd.label;
  document.getElementById('res-desc').textContent  = qd.desc;

  document.getElementById('res-scores').innerHTML = `
    <div class="score-row">
      <div class="score-label">Intencionalidade do Relacionamento</div>
      <div class="score-bar-wrap">
        <div class="score-bar"><div class="score-fill" style="width:${(a/30)*100}%"></div></div>
        <span class="score-val">${a}<small>/30</small></span>
      </div>
    </div>
    <div class="score-row">
      <div class="score-label">Postura Relacional</div>
      <div class="score-bar-wrap">
        <div class="score-bar"><div class="score-fill" style="width:${(b/30)*100}%"></div></div>
        <span class="score-val">${b}<small>/30</small></span>
      </div>
    </div>`;

  whenAssetsReady(() => drawChart(document.getElementById('chart-canvas'), a, b, user.name));
}

function bindStep3() {
  document.getElementById('btn-dl-chart').addEventListener('click', () =>
    dlCanvas(document.getElementById('chart-canvas'),
      `diagnostico-king-${firstName()}.png`));

  document.getElementById('btn-to-cert').addEventListener('click', () => {
    buildCertificate();
    goToStep(4);
  });
}

/* ══════════════════════════════════
   CANVAS — GRÁFICO DO QUADRANTE
══════════════════════════════════ */
function drawChart(canvas, a, b, name) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 680, H = 630;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const dispW = Math.min(W, window.innerWidth - 32);
  canvas.style.width  = dispW + 'px';
  canvas.style.height = Math.round(dispW * H / W) + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS  = "Inter, system-ui, sans-serif";
  const GOLD = '#c9a84c', GOLD_L = '#e2c06a', T1 = '#f2f2f2', T2 = '#c3cbe0', T3 = '#9aa8cc', BD = '#213e70';
  const qd = Q[KingLogic.getQuadrantKey(a, b)];
  const first = (name || 'Você').trim().split(/\s+/)[0];
  const spaced = (v) => { if ('letterSpacing' in ctx) ctx.letterSpacing = v; };

  /* fundo */
  ctx.fillStyle = '#0b1530';
  ctx.fillRect(0, 0, W, H);

  /* cabeçalho */
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD; ctx.font = '600 10px ' + SANS; spaced('0.18em');
  ctx.fillText('DIAGNÓSTICO K.I.N.G.  ·  NETWORKING IS KING', 32, 40); spaced('0px');
  ctx.fillStyle = qd.key === 'sg' ? GOLD : T1; ctx.font = '700 24px ' + SERIF;
  ctx.fillText(qd.name, 32, 72);
  ctx.textAlign = 'right';
  ctx.fillStyle = T1; ctx.font = '600 14px ' + SANS;
  ctx.fillText(first, W - 32, 44);
  ctx.fillStyle = T3; ctx.font = '400 11px ' + SANS;
  ctx.fillText('Intencionalidade ' + a + '/30  ·  Postura ' + b + '/30', W - 32, 66);

  /* área do gráfico */
  const L = 72, T = 100, R = W - 32, B = 420, cW = R - L, cH = B - T;
  const SMIN = 6, SR = 24;
  const px = v => L + ((v - SMIN) / SR) * cW;
  const py = v => B - ((v - SMIN) / SR) * cH;
  const tx = px(THRESHOLD), ty = py(THRESHOLD), g = 4;

  const LBL = { sg: ['ESTRATÉGICO', 'GENEROSO  ♛'], ri: ['RELACIONAL', 'INGÊNUO'], ut: ['UTILITARISTA'], is: ['ISOLADO'] };
  [
    { k: 'ri', x: L,        y: T,        w: tx - L - g / 2, h: ty - T - g / 2 },
    { k: 'sg', x: tx + g/2, y: T,        w: R - tx - g / 2, h: ty - T - g / 2 },
    { k: 'is', x: L,        y: ty + g/2, w: tx - L - g / 2, h: B - ty - g / 2 },
    { k: 'ut', x: tx + g/2, y: ty + g/2, w: R - tx - g / 2, h: B - ty - g / 2 }
  ].forEach(c => {
    const on = c.k === qd.key, king = c.k === 'sg';
    ctx.fillStyle = king ? (on ? 'rgba(201,168,76,0.24)' : 'rgba(201,168,76,0.10)') : (on ? '#1c3566' : '#132449');
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 4); ctx.fill();
    ctx.strokeStyle = on ? (king ? GOLD : T3) : (king ? 'rgba(201,168,76,0.35)' : BD);
    ctx.lineWidth = on ? 1.5 : 1; ctx.stroke();
    ctx.fillStyle = king ? GOLD : (on ? T1 : T3);
    ctx.font = '600 10px ' + SANS; ctx.textAlign = 'left'; spaced('0.14em');
    LBL[c.k].forEach((ln, i) => ctx.fillText(ln, c.x + 14, c.y + 24 + i * 15));
    spaced('0px');
  });

  /* escalas */
  ctx.fillStyle = T3; ctx.font = '500 10px ' + SANS;
  [6, 12, 18, 24, 30].forEach(v => {
    ctx.textAlign = 'center'; ctx.fillText(v, px(v), B + 18);
    ctx.textAlign = 'right';  ctx.fillText(v, L - 10, py(v) + 3);
  });
  ctx.fillStyle = T2; ctx.font = '600 10px ' + SANS; ctx.textAlign = 'center'; spaced('0.14em');
  ctx.fillText('INTENCIONALIDADE DO RELACIONAMENTO  →', L + cW / 2, B + 40);
  ctx.save(); ctx.translate(28, T + cH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('POSTURA RELACIONAL  →', 0, 0); ctx.restore();
  spaced('0px');

  /* ponto do participante */
  const dx = px(a), dy = py(b);
  const glow = ctx.createRadialGradient(dx, dy, 0, dx, dy, 30);
  glow.addColorStop(0, 'rgba(226,192,106,0.55)');
  glow.addColorStop(1, 'rgba(226,192,106,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(dx, dy, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = GOLD; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(dx, dy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.font = '600 12px ' + SANS;
  const tw = ctx.measureText(first).width + 22;
  const lx = Math.min(Math.max(dx - tw / 2, L + 4), R - tw - 4);
  let ly = dy - 42; if (ly < T + 4) ly = dy + 18;
  ctx.fillStyle = '#0b1530'; ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(lx, ly, tw, 24, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = GOLD_L; ctx.textAlign = 'center';
  ctx.fillText(first, lx + tw / 2, ly + 16);

  /* faixa inferior: capa · autor · texto · QR */
  const SX = 16, SY = 476, SW = W - 32, SH = H - SY - 16, cy = SY + SH / 2;
  ctx.fillStyle = '#0f1e40'; ctx.strokeStyle = BD; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(SX, SY, SW, SH, 6); ctx.fill(); ctx.stroke();

  const covW = 54, covH = 72, covX = 36, covY = cy - covH / 2;
  if (_imgBookCover) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(covX, covY, covW, covH, 3); ctx.clip();
    ctx.drawImage(_imgBookCover, covX, covY, covW, covH); ctx.restore();
  }
  const phR = 28, phX = covX + covW + 18 + phR;
  if (_imgAuthor) {
    ctx.save(); ctx.beginPath(); ctx.arc(phX, cy, phR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(_imgAuthor, phX - phR, cy - phR, phR * 2, phR * 2); ctx.restore();
    ctx.strokeStyle = 'rgba(201,168,76,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(phX, cy, phR, 0, Math.PI * 2); ctx.stroke();
  }
  const txX = phX + phR + 18;
  ctx.textAlign = 'left';
  ctx.fillStyle = T1; ctx.font = '700 15px ' + SERIF; ctx.fillText('Cláudio Alcoforado', txX, cy - 16);
  ctx.fillStyle = T2; ctx.font = '400 12px ' + SANS; ctx.fillText('Autor de Networking is KING', txX, cy + 2);
  ctx.fillStyle = T3; ctx.font = '400 11px ' + SANS; ctx.fillText('Faça o diagnóstico gratuito', txX, cy + 22);
  ctx.fillStyle = GOLD; ctx.font = '600 11px ' + SANS; ctx.fillText('networkingisking.net/assessment', txX, cy + 37);

  const qr = 80, qrX = W - 36 - qr, qrY = cy - qr / 2;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(qrX - 5, qrY - 5, qr + 10, qr + 10, 4); ctx.fill();
  _drawQR(ctx, qrX, qrY, qr, 'https://networkingisking.net/assessment/');
}

/* ══════════════════════════════════
   PASSO 4 — CERTIFICADO + DOWNLOADS
══════════════════════════════════ */
function buildCertificate() {
  document.getElementById('cert-fname').textContent = firstName();
  whenAssetsReady(() => {
  drawCertificate(document.getElementById('cert-canvas'), state.user, state.quadrant, state.scores);

  // Upload em segundo plano — não bloqueia a UI
  const canvas = document.getElementById('cert-canvas');
  canvas.toBlob(async (blob) => {
    const filename = `${firstName().toLowerCase()}-${Math.random().toString(36).slice(2, 9)}.png`;
    const url = typeof uploadCertificate === 'function'
      ? await uploadCertificate(blob, filename)
      : null;
    if (url) state.certUrl = url;
  }, 'image/png');
  });
}

function bindStep4() {
  document.getElementById('btn-dl-cert').addEventListener('click', dlCertPdf);

  document.getElementById('btn-dl-chart2').addEventListener('click', () =>
    dlCanvas(document.getElementById('chart-canvas'), `diagnostico-king-${firstName()}.png`));

  document.getElementById('btn-dl-answers').addEventListener('click', dlAnswers);

  document.getElementById('btn-share-wpp').addEventListener('click', async () => {
    const txt = `Fiz o diagnóstico do livro *Networking is KING* de Cláudio Alcoforado e meu perfil é *${state.quadrant.name}*! 🏆\n\nFaça o seu: https://networkingisking.net/assessment/`;

    const certCanvas  = document.getElementById('cert-canvas');
    const chartCanvas = document.getElementById('chart-canvas');

    if (navigator.share && navigator.canShare) {
      try {
        const toFile = (canvas, name) => new Promise(res =>
          canvas.toBlob(blob => res(new File([blob], name, { type: 'image/png' })), 'image/png')
        );
        const files = await Promise.all([
          toFile(certCanvas,  `certificado-king-${firstName()}.png`),
          toFile(chartCanvas, `grafico-king-${firstName()}.png`)
        ]);
        if (navigator.canShare({ files })) {
          await navigator.share({ files, text: txt });
          return;
        }
      } catch (e) {
        if (e.name === 'AbortError') return; // usuário cancelou a gaveta
      }
    }

    // Fallback desktop: link de texto pelo wa.me
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
  });

  document.getElementById('btn-share-li').addEventListener('click', () => {
    const liUrl = 'https://networkingisking.net/assessment/';
    const texto = `Fiz o Diagnóstico K.I.N.G. do livro "Networking is KING" de Cláudio Alcoforado e meu perfil é ${state.quadrant.name} — ${state.quadrant.label}.\n\nFaça o seu diagnóstico gratuito: ${liUrl}`;

    navigator.clipboard.writeText(texto).catch(() => {});
    showToast('✓ Texto copiado — cole no campo do LinkedIn');
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(liUrl)}`,
      '_blank'
    );
  });

  document.getElementById('btn-restart').addEventListener('click', () => location.reload());
}

/* ══════════════════════════════════
   CANVAS — CERTIFICADO
══════════════════════════════════ */
function _drawSeal(ctx, cx, cy, r) {
  const SANS = "Inter, system-ui, sans-serif";
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#f3dc94'); g.addColorStop(0.55, '#c9a84c'); g.addColorStop(1, '#8f7330');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(14,30,69,0.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();
  const txt = 'DIAGNÓSTICO K.I.N.G. · NETWORKING IS KING · ';
  const chars = Array.from(txt), step = (Math.PI * 2) / chars.length;
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = '#0e1e45'; ctx.font = '700 7px ' + SANS; ctx.textAlign = 'center';
  chars.forEach((ch, i) => { ctx.save(); ctx.rotate(i * step); ctx.fillText(ch, 0, -(r - 12)); ctx.restore(); });
  ctx.restore();
  const ir = r - 21;
  ctx.fillStyle = '#0e1e45'; ctx.beginPath(); ctx.arc(cx, cy, ir, 0, Math.PI * 2); ctx.fill();
  if (_imgCrown) {
    const s = ir * 1.5, ratio = _imgCrown.naturalHeight / _imgCrown.naturalWidth || 1;
    ctx.drawImage(_imgCrown, cx - s / 2, cy - (s * ratio) / 2, s, s * ratio);
  } else {
    ctx.fillStyle = '#e2c06a'; ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('♛', cx, cy + 1); ctx.textBaseline = 'alphabetic';
  }
}

function drawCertificate(canvas, user, qd, scores) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 900, H = 640;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const dispW = Math.min(W, window.innerWidth - 48);
  canvas.style.width  = dispW + 'px';
  canvas.style.height = Math.round(dispW * H / W) + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS  = "Inter, system-ui, sans-serif";
  const GOLD = '#c9a84c', T1 = '#f2f2f2', T2 = '#c3cbe0', T3 = '#9aa8cc';
  const spaced = (v) => { if ('letterSpacing' in ctx) ctx.letterSpacing = v; };
  const king = qd.key === 'sg';

  /* fundo navy da capa */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0e1e45'); bg.addColorStop(1, '#152855');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W * 0.35, H * 0.4, H * 0.2, W / 2, H / 2, W * 0.75);
  vig.addColorStop(0, 'rgba(201,168,76,0.05)'); vig.addColorStop(1, 'rgba(4,10,28,0.5)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  /* molduras */
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(26, 26, W - 52, H - 52);
  [[18, 18], [W - 18, 18], [18, H - 18], [W - 18, H - 18]].forEach(([x, y]) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#0e1e45'; ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.strokeRect(-7, -7, 14, 14);
    ctx.fillStyle = GOLD; ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.restore();
  });

  /* coluna de texto */
  const X = 72;
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD; ctx.font = '600 11px ' + SANS; spaced('0.3em');
  ctx.fillText('NETWORKING IS KING', X, 92); spaced('0px');
  ctx.fillStyle = T1; ctx.font = '700 52px ' + SERIF; ctx.fillText('Certificado', X, 152);
  ctx.fillStyle = T2; ctx.font = '400 15px ' + SANS; ctx.fillText('Diagnóstico K.I.N.G. de Networking', X, 182);
  ctx.fillStyle = GOLD; ctx.fillRect(X, 204, 56, 2);

  ctx.fillStyle = T2; ctx.font = 'italic 400 17px ' + SERIF; ctx.fillText('Certificamos que', X, 246);
  let fs = 44; ctx.font = '700 ' + fs + 'px ' + SERIF;
  while (ctx.measureText(user.name).width > 470 && fs > 22) { fs -= 2; ctx.font = '700 ' + fs + 'px ' + SERIF; }
  ctx.fillStyle = T1; ctx.fillText(user.name, X, 298);

  ctx.fillStyle = T2; ctx.font = '400 15px ' + SANS;
  ctx.fillText('concluiu o Diagnóstico K.I.N.G. e conquistou o perfil', X, 336);
  ctx.fillStyle = king ? GOLD : T1; ctx.font = '700 32px ' + SERIF; ctx.fillText(qd.name, X, 382);
  ctx.fillStyle = T3; ctx.font = 'italic 400 15px ' + SERIF; ctx.fillText(qd.label, X, 408);

  /* painel do quadrante */
  const PX = 592, PY = 72, PW = 236, PH = 304;
  ctx.fillStyle = 'rgba(11,21,48,0.6)'; ctx.strokeStyle = 'rgba(201,168,76,0.28)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(PX, PY, PW, PH, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.font = '600 9.5px ' + SANS; spaced('0.18em'); ctx.textAlign = 'left';
  ctx.fillText('SEU QUADRANTE', PX + 22, PY + 30); spaced('0px');

  const G = 150, gx = PX + 50, gy = PY + 46, gp = 3, cs = (G - gp) / 2;
  [['ri', 0, 0], ['sg', 1, 0], ['is', 0, 1], ['ut', 1, 1]].forEach(([k, c, r]) => {
    const on = k === qd.key, kk = k === 'sg';
    ctx.fillStyle = kk ? (on ? 'rgba(201,168,76,0.32)' : 'rgba(201,168,76,0.12)') : (on ? '#1c3566' : '#132449');
    ctx.beginPath(); ctx.roundRect(gx + c * (cs + gp), gy + r * (cs + gp), cs, cs, 3); ctx.fill();
    if (on) { ctx.strokeStyle = kk ? GOLD : T3; ctx.lineWidth = 1; ctx.stroke(); }
  });
  ctx.fillStyle = GOLD; ctx.font = '12px serif'; ctx.textAlign = 'right';
  ctx.fillText('♛', gx + G - 6, gy + 15);
  ctx.textAlign = 'center';
  const dX = gx + ((scores.a - 6) / 24) * G, dY = gy + G - ((scores.b - 6) / 24) * G;
  ctx.fillStyle = '#e2c06a'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(dX, dY, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = T3; ctx.font = '500 9px ' + SANS;
  ctx.fillText('Intencionalidade →', gx + G / 2, gy + G + 16);
  ctx.save(); ctx.translate(gx - 12, gy + G / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Postura →', 0, 0); ctx.restore();

  ctx.textAlign = 'left';
  [['INTENCIONALIDADE', scores.a, PX + 22], ['POSTURA', scores.b, PX + 136]].forEach(([l, v, x]) => {
    ctx.fillStyle = T3; ctx.font = '600 8.5px ' + SANS; spaced('0.12em'); ctx.fillText(l, x, PY + PH - 50); spaced('0px');
    ctx.fillStyle = T1; ctx.font = '700 24px ' + SERIF; ctx.fillText(String(v), x, PY + PH - 22);
    const vw = ctx.measureText(String(v)).width;
    ctx.fillStyle = T3; ctx.font = '400 12px ' + SANS; ctx.fillText('/30', x + vw + 3, PY + PH - 22);
  });

  /* rodapé: capa + data · selo · assinatura */
  const dv = ctx.createLinearGradient(X, 0, W - X, 0);
  dv.addColorStop(0, 'rgba(201,168,76,0.55)'); dv.addColorStop(1, 'rgba(201,168,76,0.05)');
  ctx.strokeStyle = dv; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X, 452); ctx.lineTo(W - X, 452); ctx.stroke();

  if (_imgBookCover) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(X, 486, 44, 59, 2); ctx.clip();
    ctx.drawImage(_imgBookCover, X, 486, 44, 59); ctx.restore();
  }
  const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.textAlign = 'left';
  ctx.fillStyle = T3; ctx.font = '400 11px ' + SANS; ctx.fillText('Emitido em', X + 60, 508);
  ctx.fillStyle = T1; ctx.font = '600 15px ' + SERIF; ctx.fillText(date, X + 60, 530);

  _drawSeal(ctx, W / 2, 522, 50);

  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD; ctx.font = 'italic 400 24px ' + SERIF; ctx.fillText('Cláudio Alcoforado', W - X, 512);
  ctx.strokeStyle = 'rgba(201,168,76,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W - X - 220, 524); ctx.lineTo(W - X, 524); ctx.stroke();
  ctx.fillStyle = T3; ctx.font = '400 11px ' + SANS; ctx.fillText('Autor · Networkaholic', W - X, 542);

  ctx.textAlign = 'center'; ctx.fillStyle = T3; ctx.font = '400 10px ' + SANS; spaced('0.08em');
  ctx.fillText('ISBN 978-65-01-90453-5  ·  networkingisking.net', W / 2, 600); spaced('0px');
}

/* ══════════════════════════════════
   DOWNLOAD HELPERS
══════════════════════════════════ */
function dlCanvas(canvas, filename) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function dlCertPdf() {
  let imgData;
  try {
    imgData = document.getElementById('cert-canvas').toDataURL('image/png');
  } catch (_) {
    dlCanvas(document.getElementById('cert-canvas'), `certificado-king-${firstName()}.png`);
    return;
  }

  const win = window.open('', '_blank');
  if (!win) {
    // popup bloqueado — baixa como PNG
    dlCanvas(document.getElementById('cert-canvas'), `certificado-king-${firstName()}.png`);
    return;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Certificado KING - ${state.user.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0b1530;display:flex;align-items:center;justify-content:center;min-height:100vh}
img{width:100%;max-width:900px;display:block;margin:auto}
@page{margin:0;size:landscape}
@media print{body{padding:0}img{width:100%;max-width:100%}}
</style>
</head><body>
<img src="${imgData}" alt="Certificado Networking is KING"
  onload="setTimeout(function(){window.print();},600)" />
</body></html>`;

  win.document.write(html);
  win.document.close();
}

function firstName() {
  return KingLogic.firstName(state.user.name);
}

function showToast(msg, ms) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms || 3500);
}

/* Gera página de respostas e abre para impressão/PDF */
function dlAnswers() {
  const { user, answers, scores, quadrant: qd } = state;

  const rowsA = QA.map((q, i) => `
    <tr>
      <td class="n">${i+1}</td>
      <td>${q}</td>
      <td class="s"><b>${answers.a[i]}</b><br><span>${SCALE_FULL[answers.a[i]]}</span></td>
    </tr>`).join('');

  const rowsB = QB.map((q, i) => `
    <tr>
      <td class="n">${i+7}</td>
      <td>${q}</td>
      <td class="s"><b>${answers.b[i]}</b><br><span>${SCALE_FULL[answers.b[i]]}</span></td>
    </tr>`).join('');

  const coverSrc = _getImgDataURL(_imgBookCover);

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Diagnóstico NIK, ${user.name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#fff;color:#111;padding:40px;max-width:780px;margin:0 auto}
.hd{text-align:center;border-bottom:2px solid #c9a84c;padding-bottom:20px;margin-bottom:28px}
.crown{font-size:28px;margin-bottom:6px}
h1{font-family:'Playfair Display',serif;font-size:22px}
.sub{color:#888;font-size:12px;margin-top:4px}
.prof{background:#faf7ee;border-left:4px solid #c9a84c;padding:16px 20px;margin-bottom:26px;border-radius:4px}
.prof h2{font-family:'Playfair Display',serif;color:#a8893a;font-size:18px;margin-bottom:3px}
.prof .si{font-size:12px;color:#777;font-style:italic;margin-bottom:10px}
.sc{display:flex;gap:28px}
.scl{font-size:10px;color:#aaa}
.scv{font-size:20px;font-weight:700;color:#c9a84c}
.bt{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid #e8dfc5}
table{width:100%;border-collapse:collapse}
td{padding:9px 10px;border-bottom:1px solid #f0ead8;font-size:12px;vertical-align:top}
td.n{width:24px;color:#c9a84c;font-weight:700}
td.s{width:175px;color:#666}
td.s b{font-size:16px;color:#333}
td.s span{font-size:10px;color:#aaa;display:block;margin-top:1px}
.ft{margin-top:32px;text-align:center;color:#bbb;font-size:11px}
@media print{body{padding:20px}}
</style></head><body>
<div class="hd" style="display:flex;align-items:flex-start;gap:20px;">
  <div style="flex:1">
    <div class="crown">♛</div>
    <h1>Diagnóstico de Networking, O Estilo K.I.N.G.</h1>
    <p class="sub">Networking is KING · Cláudio Alcoforado · ISBN 978-65-01-90453-5</p>
  </div>
  ${coverSrc ? `<img src="${coverSrc}" style="width:52px;height:69px;object-fit:cover;border-radius:3px;border:1px solid #c9a84c;flex-shrink:0;margin-top:4px" alt="Networking is KING" />` : ''}
</div>
<div class="prof">
  <h2>${user.name}</h2>
  <p class="si">${qd.name} · ${qd.label}</p>
  <div class="sc">
    <div><div class="scl">Intencionalidade</div><div class="scv">${scores.a}<small style="font-size:11px;color:#bbb">/30</small></div></div>
    <div><div class="scl">Postura Relacional</div><div class="scv">${scores.b}<small style="font-size:11px;color:#bbb">/30</small></div></div>
  </div>
</div>
<div class="bt">Bloco A: Intencionalidade do Relacionamento</div>
<table><tbody>${rowsA}</tbody></table>
<div class="bt">Bloco B: Postura Relacional</div>
<table><tbody>${rowsB}</tbody></table>
<div class="ft">
  <p>networkingisking.net · ${new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</p>
</div>
<script>setTimeout(()=>window.print(),600);<\/script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
