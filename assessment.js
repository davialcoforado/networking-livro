/* ══════════════════════════════════════════════════════
   NETWORKING IS KING — Diagnóstico K.I.N.G.
   assessment.js

   Quadrante baseado no livro de Cláudio Alcoforado.
   Eixo X = Intencionalidade do Relacionamento (Bloco A)
   Eixo Y = Postura Relacional (Bloco B)
   Escala: 0–30  |  Limiar: 15
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
  'Preocupo-me com o impacto das minhas ações na confiança',
  'Sou lembrado como alguém que agrega valor'
];

const SCALE_FULL = [
  '', 'Discordo totalmente', 'Discordo parcialmente',
  'Nem concordo\nnem discordo', 'Concordo parcialmente', 'Concordo totalmente'
];

/* ─── QUADRANTES ─── */
const THRESHOLD = 15;

const Q = {
  sg: {
    key: 'sg',
    tag: '♛ A Atitude KING',
    name: 'Estratégico / Generoso',
    label: 'O perfil mais completo de networking',
    desc: 'Você age com intenção e gera valor genuíno para sua rede. Planeja conscientemente seus relacionamentos e, ao mesmo tempo, impacta positivamente quem está ao seu redor. Isso é a Atitude King — o perfil mais completo e poderoso do networking.',
    color: '#c9a84c'
  },
  ri: {
    key: 'ri',
    tag: '♡ Relacional',
    name: 'Relacional / Ingênuo',
    label: 'Generoso, mas pouco intencional',
    desc: 'Você se relaciona com autenticidade e gera impacto genuíno nas pessoas. Tem foco no outro e forte presença relacional. Para alcançar a Atitude King, desenvolva mais intencionalidade: planeje sua rede com clareza de propósito e objetivos.',
    color: '#64b5f6'
  },
  ut: {
    key: 'ut',
    tag: '♟ Estratégico',
    name: 'Utilitarista',
    label: 'Intencional, mas pouco generoso',
    desc: 'Você tem clareza estratégica sobre sua rede e age com foco. Para alcançar a Atitude King, pratique a generosidade: compartilhe, ajude e construa confiança sem esperar retorno imediato. Networking real vai além da troca direta.',
    color: '#81c784'
  },
  is: {
    key: 'is',
    tag: '◎ Em Desenvolvimento',
    name: 'Isolado',
    label: 'Networking ainda em construção',
    desc: 'Você está no início da jornada do networking. Há um enorme espaço para crescimento nos dois eixos — intencionalidade e postura relacional. Este livro foi escrito exatamente para quem quer construir uma rede sólida e autêntica.',
    color: '#9e9e9e'
  }
};

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
      name:    document.getElementById('f-name').value.trim(),
      email:   document.getElementById('f-email').value.trim(),
      country: document.getElementById('f-country').value.trim(),
      state:   document.getElementById('f-state').value.trim(),
      zip:     document.getElementById('f-zip').value.trim()
    };

    goToStep(2);
  });
}

function validateReg() {
  let ok = true;
  const name  = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const lgpd  = document.getElementById('f-lgpd').checked;

  setErr('e-name', !name ? 'Por favor, informe seu nome.' : '');
  setErr('e-email', !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Informe um e-mail válido.' : '');
  setErr('e-lgpd', !lgpd ? 'Você precisa aceitar os termos para continuar.' : '');

  return name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && lgpd;
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

/* ══════════════════════════════════
   PASSO 2 — QUESTIONÁRIO
══════════════════════════════════ */
function bindStep2() {
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

    // Salva no Supabase em segundo plano (não bloqueia a UI)
    if (typeof saveLead === 'function') {
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

  drawChart(document.getElementById('chart-canvas'), a, b, user.name);
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
  const W = 680, H = 500;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const M = { top: 58, right: 40, bottom: 82, left: 82 };
  const cW = W - M.left - M.right;
  const cH = H - M.top  - M.bottom;

  /* 0–30 scale mapping */
  const px = v => M.left + (v / 30) * cW;
  const py = v => M.top  + cH - (v / 30) * cH;
  const thX = px(THRESHOLD);
  const thY = py(THRESHOLD);

  /* ── background ── */
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, W, H);

  /* thin border */
  ctx.strokeStyle = 'rgba(201,168,76,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(5, 5, W - 10, H - 10);

  /* ── quadrant fills ── */
  const fills = [
    { x: thX, y: M.top,    w: M.left+cW-thX, h: thY-M.top,     c: 'rgba(201,168,76,0.10)' }, /* SG top-right */
    { x: M.left, y: M.top, w: thX-M.left,    h: thY-M.top,     c: 'rgba(100,181,246,0.05)' }, /* RI top-left */
    { x: thX, y: thY,      w: M.left+cW-thX, h: M.top+cH-thY,  c: 'rgba(129,199,132,0.05)' }, /* UT bot-right */
    { x: M.left, y: thY,   w: thX-M.left,    h: M.top+cH-thY,  c: 'rgba(158,158,158,0.03)' }  /* IS bot-left */
  ];
  fills.forEach(({ x, y, w, h, c }) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); });

  /* ── grid ── */
  ctx.strokeStyle = 'rgba(201,168,76,0.09)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 8]);
  [5, 10, 15, 20, 25, 30].forEach(v => {
    ctx.beginPath(); ctx.moveTo(px(v), M.top);    ctx.lineTo(px(v), M.top + cH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(M.left, py(v));   ctx.lineTo(M.left + cW, py(v)); ctx.stroke();
  });
  ctx.setLineDash([]);

  /* ── threshold lines ── */
  ctx.strokeStyle = 'rgba(201,168,76,0.48)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath(); ctx.moveTo(thX, M.top - 4); ctx.lineTo(thX, M.top + cH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(M.left, thY); ctx.lineTo(M.left + cW + 4, thY); ctx.stroke();
  ctx.setLineDash([]);

  /* ── axes ── */
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(M.left, M.top - 10); ctx.lineTo(M.left, M.top + cH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(M.left, M.top + cH); ctx.lineTo(M.left + cW + 10, M.top + cH); ctx.stroke();

  /* arrowheads */
  ctx.fillStyle = '#c9a84c';
  ctx.beginPath(); ctx.moveTo(M.left - 4, M.top - 2); ctx.lineTo(M.left, M.top - 12); ctx.lineTo(M.left + 4, M.top - 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(M.left + cW + 2, M.top + cH - 4); ctx.lineTo(M.left + cW + 12, M.top + cH); ctx.lineTo(M.left + cW + 2, M.top + cH + 4); ctx.fill();

  /* ── tick labels ── */
  ctx.fillStyle = 'rgba(201,168,76,0.55)';
  ctx.font = '11px monospace';
  [0, 5, 10, 15, 20, 25, 30].forEach(v => {
    ctx.textAlign = 'center';
    ctx.fillText(v, px(v), M.top + cH + 17);
    ctx.textAlign = 'right';
    ctx.fillText(v, M.left - 8, py(v) + 4);
  });

  /* ── axis labels ── */
  ctx.fillStyle = '#c9a84c';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('INTENCIONALIDADE DO RELACIONAMENTO', M.left + cW / 2, H - 10);

  ctx.save();
  ctx.translate(14, M.top + cH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('POSTURA RELACIONAL', 0, 0);
  ctx.restore();

  /* Y-axis sub-labels */
  ctx.font = '9.5px Georgia, serif';
  ctx.fillStyle = 'rgba(201,168,76,0.38)';
  ctx.save(); ctx.translate(30, M.top + cH * 0.25); ctx.rotate(-Math.PI / 2); ctx.fillText('Foco no Outro', 0, 0); ctx.restore();
  ctx.save(); ctx.translate(30, M.top + cH * 0.75); ctx.rotate(-Math.PI / 2); ctx.fillText('Foco em si', 0, 0); ctx.restore();

  /* X-axis sub-labels */
  ctx.fillStyle = 'rgba(201,168,76,0.38)';
  ctx.font = '9.5px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Baixa', M.left + cW * 0.25, M.top + cH + 32);
  ctx.fillText('Alta',  M.left + cW * 0.75, M.top + cH + 32);

  /* ── quadrant labels ── */
  const ql = [
    { lines: ['ESTRATÉGICO', 'GENEROSO ♛'], cx: (thX + M.left + cW) / 2, cy: (M.top + thY) / 2,    c: 'rgba(201,168,76,0.72)' },
    { lines: ['RELACIONAL',  'INGÊNUO'],    cx: (M.left + thX) / 2,       cy: (M.top + thY) / 2,    c: 'rgba(100,181,246,0.55)' },
    { lines: ['UTILITARISTA'],              cx: (thX + M.left + cW) / 2,  cy: (thY + M.top + cH) / 2, c: 'rgba(129,199,132,0.52)' },
    { lines: ['ISOLADO'],                   cx: (M.left + thX) / 2,       cy: (thY + M.top + cH) / 2, c: 'rgba(158,158,158,0.42)' }
  ];

  ctx.font = 'bold 11px Georgia, serif';
  ql.forEach(({ lines, cx, cy, c }) => {
    ctx.fillStyle = c;
    ctx.textAlign = 'center';
    const offset = ((lines.length - 1) * 17) / 2;
    lines.forEach((line, i) => ctx.fillText(line, cx, cy - offset + i * 17));
  });

  /* ── title ── */
  ctx.fillStyle = 'rgba(201,168,76,0.75)';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('O Estilo K.I.N.G.  ·  Networking is KING  ·  Cláudio Alcoforado', W / 2, 32);

  /* ── user dot ── */
  const dx = px(a), dy = py(b);

  /* glow */
  const glow = ctx.createRadialGradient(dx, dy, 0, dx, dy, 28);
  glow.addColorStop(0, 'rgba(201,168,76,0.62)');
  glow.addColorStop(1, 'rgba(201,168,76,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(dx, dy, 28, 0, Math.PI * 2); ctx.fill();

  /* dot */
  ctx.fillStyle = '#c9a84c';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(dx, dy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  /* name label */
  const lbl = (name || 'Você').split(' ')[0];
  ctx.font = 'bold 12px Inter, sans-serif';
  const tw = ctx.measureText(lbl).width + 22;
  const lx = dx - tw / 2, ly = dy - 34;

  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.beginPath();
  ctx.roundRect(lx, ly - 14, tw, 20, 8);
  ctx.fill();

  ctx.fillStyle = '#e2c06a';
  ctx.textAlign = 'center';
  ctx.fillText(lbl, dx, ly);

  /* score annotation */
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(201,168,76,0.58)';
  ctx.textAlign = 'center';
  ctx.fillText(`(${a}, ${b})`, dx, dy + 25);
}

/* ══════════════════════════════════
   PASSO 4 — CERTIFICADO + DOWNLOADS
══════════════════════════════════ */
function buildCertificate() {
  const { name } = state.user;
  document.getElementById('cert-fname').textContent = firstName();
  drawCertificate(document.getElementById('cert-canvas'), state.user, state.quadrant, state.scores);
}

function bindStep4() {
  document.getElementById('btn-dl-cert').addEventListener('click', () =>
    dlCanvas(document.getElementById('cert-canvas'), `certificado-king-${firstName()}.png`));

  document.getElementById('btn-dl-chart2').addEventListener('click', () =>
    dlCanvas(document.getElementById('chart-canvas'), `diagnostico-king-${firstName()}.png`));

  document.getElementById('btn-dl-answers').addEventListener('click', dlAnswers);

  document.getElementById('btn-share-wpp').addEventListener('click', () => {
    const txt = `Fiz o diagnóstico do livro *Networking is KING* de Cláudio Alcoforado e meu perfil é *${state.quadrant.name}*! 🏆\n\nFaça o seu: https://networkingisking.net/assessment/`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
  });

  document.getElementById('btn-share-li').addEventListener('click', () => {
    const url = encodeURIComponent('https://networkingisking.net/assessment/');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  });

  document.getElementById('btn-restart').addEventListener('click', () => location.reload());
}

/* ══════════════════════════════════
   CANVAS — CERTIFICADO
══════════════════════════════════ */
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

  /* ── background ── */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0d0d0d');
  bg.addColorStop(0.55, '#111009');
  bg.addColorStop(1, '#160f02');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* diagonal texture */
  ctx.strokeStyle = 'rgba(201,168,76,0.022)';
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 24) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }

  /* ── borders ── */
  ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.strokeStyle = 'rgba(201,168,76,0.28)'; ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  /* ── corner ornaments ── */
  [[30, 30, 'tl'], [W-30, 30, 'tr'], [30, H-30, 'bl'], [W-30, H-30, 'br']].forEach(([x, y, p]) => {
    const s = 24;
    ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (p === 'tl') { ctx.moveTo(x+s,y); ctx.lineTo(x,y); ctx.lineTo(x,y+s); }
    if (p === 'tr') { ctx.moveTo(x-s,y); ctx.lineTo(x,y); ctx.lineTo(x,y+s); }
    if (p === 'bl') { ctx.moveTo(x+s,y); ctx.lineTo(x,y); ctx.lineTo(x,y-s); }
    if (p === 'br') { ctx.moveTo(x-s,y); ctx.lineTo(x,y); ctx.lineTo(x,y-s); }
    ctx.stroke();
    ctx.fillStyle = '#c9a84c';
    ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
  });

  /* ── crown ── */
  ctx.font = '54px serif';
  ctx.fillStyle = '#c9a84c';
  ctx.textAlign = 'center';
  ctx.fillText('♛', W / 2, 106);

  /* ── book name ── */
  ctx.font = 'bold 10px Georgia, serif';
  ctx.fillStyle = 'rgba(201,168,76,0.58)';
  ctx.textAlign = 'center';
  ctx.fillText('N E T W O R K I N G   I S   K I N G', W / 2, 134);

  /* divider */
  const gd = (y) => {
    const g = ctx.createLinearGradient(80, y, W-80, y);
    g.addColorStop(0, 'transparent'); g.addColorStop(0.5, 'rgba(201,168,76,0.52)'); g.addColorStop(1, 'transparent');
    return g;
  };
  ctx.strokeStyle = gd(150); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 150); ctx.lineTo(W-80, 150); ctx.stroke();

  /* ── CERTIFICADO ── */
  ctx.font = `bold 27px 'Playfair Display', Georgia, serif`;
  ctx.fillStyle = '#c9a84c';
  ctx.textAlign = 'center';
  ctx.fillText('C E R T I F I C A D O', W / 2, 196);

  /* "Certificamos que" */
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.fillText('Certificamos que', W / 2, 236);

  /* ── NAME ── */
  ctx.font = `bold 40px 'Playfair Display', Georgia, serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(user.name, W / 2, 293);

  /* underline */
  const nw = ctx.measureText(user.name).width;
  ctx.strokeStyle = gd(304); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W/2 - nw/2, 304); ctx.lineTo(W/2 + nw/2, 304); ctx.stroke();

  /* "possui o perfil" */
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.52)';
  ctx.fillText('possui o perfil', W / 2, 338);

  /* ── QUADRANT NAME ── */
  ctx.font = `bold 25px 'Playfair Display', Georgia, serif`;
  ctx.fillStyle = qd.color || '#c9a84c';
  ctx.fillText(qd.name.toUpperCase(), W / 2, 375);

  /* book reference */
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fillText('conforme diagnóstico do livro', W / 2, 412);

  ctx.font = `bold 14px 'Playfair Display', Georgia, serif`;
  ctx.fillStyle = '#c9a84c';
  ctx.fillText('"Networking is King — A Atitude King"', W / 2, 436);

  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fillText('por Cláudio Alcoforado · Networkaholic', W / 2, 458);

  /* ── bottom divider ── */
  ctx.strokeStyle = gd(480); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 480); ctx.lineTo(W-80, 480); ctx.stroke();

  /* ── date ── */
  const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.textAlign = 'left';
  ctx.fillText(date, 90, 524);

  /* ── signature ── */
  ctx.strokeStyle = 'rgba(201,168,76,0.32)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W-260, 516); ctx.lineTo(W-88, 516); ctx.stroke();

  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillStyle = '#c9a84c';
  ctx.textAlign = 'right';
  ctx.fillText('Cláudio Alcoforado', W - 88, 513);

  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fillText('Autor · Networkaholic', W - 88, 530);

  /* ── ISBN ── */
  ctx.textAlign = 'center';
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(201,168,76,0.28)';
  ctx.fillText('ISBN 978-65-01-90453-5  ·  networkingisking.net', W / 2, 570);
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

function firstName() {
  return KingLogic.firstName(state.user.name);
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

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Diagnóstico NIK — ${user.name}</title>
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
<div class="hd">
  <div class="crown">♛</div>
  <h1>Diagnóstico de Networking — O Estilo K.I.N.G.</h1>
  <p class="sub">Networking is KING · Cláudio Alcoforado · ISBN 978-65-01-90453-5</p>
</div>
<div class="prof">
  <h2>${user.name}</h2>
  <p class="si">${qd.name} · ${qd.label}</p>
  <div class="sc">
    <div><div class="scl">Intencionalidade</div><div class="scv">${scores.a}<small style="font-size:11px;color:#bbb">/30</small></div></div>
    <div><div class="scl">Postura Relacional</div><div class="scv">${scores.b}<small style="font-size:11px;color:#bbb">/30</small></div></div>
  </div>
</div>
<div class="bt">Bloco A — Intencionalidade do Relacionamento</div>
<table><tbody>${rowsA}</tbody></table>
<div class="bt">Bloco B — Postura Relacional</div>
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
