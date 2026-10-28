// --- 物理常数与太阳系天体基准参数 (采用 AU, 地球日, 太阳质量 M_sun 为内部积分单位) ---
  const AU_KM = 149597870.7;
  const DAY_SEC = 86400;
  const KMS_TO_AUDAY = DAY_SEC / AU_KM;
  const AUDAY_TO_KMS = AU_KM / DAY_SEC;
  const G_GAUSS = 0.0002959122082855911; // GM_sun in AU^3 / day^2

  const PLUTO_MASS_KG = 1.303e22;
  const SATURN_MASS_RATIO_BASE = 568.32 / 1988400;
  const JUPITER_MASS_RATIO = 1898.19 / 1988400;
  const URANUS_MASS_RATIO = 86.813 / 1988400;
  const NEPTUNE_MASS_RATIO = 102.413 / 1988400;

  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');

  let width = 800, height = 600;
  let isPlaying = true;
  let simDays = 0;
  let cameraScale = 8.2;
  let cameraOffsetX = 0, cameraOffsetY = 0;
  let cameraFocus = 'sun';
  let currentPreset = 1;
  let continuousThrustMode = 'off';
  let totalDeltaVApplied = 0;
  let saturnCapturedFlag = false;
  let animFrameId = null;

  const planets = [
    { name: '木星', a: 5.204, v: 13.06 * KMS_TO_AUDAY, angle: 2.1, color: '#f59e0b', radius: 4.5, gm: G_GAUSS * JUPITER_MASS_RATIO },
    { name: '土星', a: 9.537, v: 9.67 * KMS_TO_AUDAY, angle: 0.65, color: '#eab308', radius: 6.0, gm: G_GAUSS * SATURN_MASS_RATIO_BASE, isSaturn: true },
    { name: '天王星', a: 19.191, v: 6.80 * KMS_TO_AUDAY, angle: 4.2, color: '#38bdf8', radius: 3.8, gm: G_GAUSS * URANUS_MASS_RATIO },
    { name: '海王星', a: 30.07, v: 5.43 * KMS_TO_AUDAY, angle: 5.4, color: '#60a5fa', radius: 3.8, gm: G_GAUSS * NEPTUNE_MASS_RATIO }
  ];

  const pluto = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    trail: [],
    maxTrail: 1600
  };

  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.3,
    alpha: Math.random() * 0.65 + 0.2
  }));

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(300, rect.width);
    height = Math.max(300, rect.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderCanvas();
  }

  function updatePlanetsFromAngles() {
    planets.forEach(p => {
      p.x = p.a * Math.cos(p.angle);
      p.y = p.a * Math.sin(p.angle);
      p.vx = -p.v * Math.sin(p.angle);
      p.vy = p.v * Math.cos(p.angle);
    });
  }

  function getSaturn() {
    return planets[1];
  }

  function applyPreset(id) {
    currentPreset = id;
    document.querySelectorAll('.preset-grid .btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('preset' + id);
    if (activeBtn) activeBtn.classList.add('active');

    simDays = 0;
    totalDeltaVApplied = 0;
    saturnCapturedFlag = false;
    continuousThrustMode = 'off';
    updateThrustButtons();
    pluto.trail = [];

    planets[0].angle = 2.2;
    planets[1].angle = 0.785398;
    planets[2].angle = 3.9;
    planets[3].angle = 5.3;
    updatePlanetsFromAngles();

    const r0 = 39.236;
    const theta0 = 0.35;

    if (id === 1) {
      const rPeri = 29.658;
      const vPeriKms = 6.10;
      pluto.x = rPeri * Math.cos(theta0);
      pluto.y = rPeri * Math.sin(theta0);
      pluto.vx = -vPeriKms * KMS_TO_AUDAY * Math.sin(theta0);
      pluto.vy = vPeriKms * KMS_TO_AUDAY * Math.cos(theta0);
      document.getElementById('dvMagSlider').value = 2.20;
      document.getElementById('dvAngleSlider').value = 0;
      document.getElementById('autoCaptureCheck').checked = false;
      cameraScale = 7.5;
      setCameraFocus('sun');
    } else if (id === 2) {
      pluto.x = r0 * Math.cos(theta0);
      pluto.y = r0 * Math.sin(theta0);
      const vEscapeImpactKms = 4.64 + 2.80;
      pluto.vx = -vEscapeImpactKms * KMS_TO_AUDAY * Math.sin(theta0);
      pluto.vy = vEscapeImpactKms * KMS_TO_AUDAY * Math.cos(theta0);
      totalDeltaVApplied = 2.80;
      document.getElementById('dvMagSlider').value = 3.20;
      document.getElementById('dvAngleSlider').value = 180;
      document.getElementById('autoCaptureCheck').checked = false;
      cameraScale = 6.5;
      setCameraFocus('sun');
    } else if (id === 3) {
      const rStart = 42.0;
      pluto.x = rStart * Math.cos(0.55);
      pluto.y = rStart * Math.sin(0.55);
      const vRescuedKms = 4.15;
      pluto.vx = -vRescuedKms * KMS_TO_AUDAY * Math.sin(0.55) - 0.8 * KMS_TO_AUDAY * Math.cos(0.55);
      pluto.vy = vRescuedKms * KMS_TO_AUDAY * Math.cos(0.55) - 0.8 * KMS_TO_AUDAY * Math.sin(0.55);
      totalDeltaVApplied = 2.45;
      document.getElementById('dvMagSlider').value = 2.45;
      document.getElementById('dvAngleSlider').value = -165;
      document.getElementById('autoCaptureCheck').checked = false;
      cameraScale = 7.2;
      setCameraFocus('sun');
    } else if (id === 4) {
      setupPlutoSaturnIntercept(false);
    } else if (id === 5) {
      setupPlutoSaturnIntercept(true);
    }

    updateControlLabels();
    updateEngineCalculation();
  }

  function setupPlutoSaturnIntercept(enableAutoCapture) {
    const sat = getSaturn();
    sat.angle = 0.6;
    updatePlanetsFromAngles();

    const leadDays = 260;
    const omegaSat = sat.v / sat.a;
    const interceptAngle = sat.angle + omegaSat * leadDays;
    const targetX = sat.a * Math.cos(interceptAngle);
    const targetY = sat.a * Math.sin(interceptAngle);

    const startDist = 16.5;
    const startAngle = interceptAngle + 0.18;
    pluto.x = startDist * Math.cos(startAngle);
    pluto.y = startDist * Math.sin(startAngle);

    const dx = targetX - pluto.x;
    const dy = targetY - pluto.y;
    const rMid = 0.5 * (startDist + sat.a);
    const accSun = G_GAUSS / (rMid * rMid);
    const ux = Math.cos(interceptAngle + 0.09);
    const uy = Math.sin(interceptAngle + 0.09);

    pluto.vx = (dx / leadDays) + 0.5 * accSun * leadDays * ux;
    pluto.vy = (dy / leadDays) + 0.5 * accSun * leadDays * uy;

    totalDeltaVApplied = 4.30;
    document.getElementById('autoCaptureCheck').checked = enableAutoCapture;
    document.getElementById('timeScaleSlider').value = 1.6;
    cameraScale = 22.0;
    setCameraFocus('saturn');
  }

  function updateControlLabels() {
    const dv = parseFloat(document.getElementById('dvMagSlider').value);
    const ang = parseInt(document.getElementById('dvAngleSlider').value, 10);
    const ts = parseFloat(document.getElementById('timeScaleSlider').value);

    document.getElementById('dvMagVal').textContent = dv.toFixed(2) + ' km/s';
    let dirDesc = '';
    if (ang === 0) dirDesc = ' (顺行加速)';
    else if (Math.abs(ang) === 180) dirDesc = ' (逆行制动)';
    else if (ang === -90) dirDesc = ' (径向向内)';
    else if (ang === 90) dirDesc = ' (径向向外)';
    document.getElementById('dvAngleVal').textContent = ang + '°' + dirDesc;
    document.getElementById('timeScaleVal').textContent = ts.toFixed(1) + ' 天/帧';

    updateEngineCalculation();
  }

  function updateSaturnParams() {
    const mult = parseFloat(document.getElementById('saturnMassSlider').value);
    document.getElementById('saturnMassVal').textContent = mult.toFixed(1) + 'x';
    planets[1].gm = G_GAUSS * SATURN_MASS_RATIO_BASE * mult;
  }

  function updateEngineCalculation() {
    const dvKms = parseFloat(document.getElementById('dvMagSlider').value);
    const veKms = parseFloat(document.getElementById('engineTypeSelect').value);
    const dvMs = dvKms * 1000;

    const keJoules = 0.5 * PLUTO_MASS_KG * dvMs * dvMs;
    const tsarCount = keJoules / 2.43e17;

    const impulseRequired = PLUTO_MASS_KG * dvMs;
    const singleRaptor100YrImpulse = 2.697e6 * (100 * 365.25 * 86400);
    const raptorCount = impulseRequired / singleRaptor100YrImpulse;

    document.getElementById('calcKeVal').textContent = formatSci(keJoules) + ' J';
    document.getElementById('calcTsarVal').textContent = '≈ ' + formatSci(tsarCount) + ' 颗沙皇氢弹';
    document.getElementById('calcRaptorVal').textContent = formatSci(raptorCount) + ' 台';

    // 考虑冥王星表面逃逸速度 1.21 km/s 对有效喷气速度的修正
    const veEff = veKms > 1.21 ? Math.sqrt(veKms * veKms - 1.21 * 1.21) : 0;
    const massRatio = veEff > 0 ? (1 - Math.exp(-dvKms / veEff)) : 1;
    const pct = (massRatio * 100).toFixed(2);
    document.getElementById('propMassRatioVal').textContent = veEff > 0
      ? (pct + '% (' + formatSci(PLUTO_MASS_KG * massRatio) + ' kg)')
      : '无法逃逸 (净推力=0)';

    const ispSec = Math.round((veKms * 1000) / 9.80665);
    document.getElementById('ispVal').textContent = 'v_e = ' + veKms + ' km/s (Isp=' + ispSec.toLocaleString() + 's)';

    const alertBox = document.getElementById('engineeringAlert');
    if (veKms <= 1.21) {
      alertBox.innerHTML = '⚠️ <strong>物理禁区警告：</strong> 当前喷气速度 (<code>' + veKms + ' km/s</code>) 低于或等于冥王星表面逃逸速度 (<code>1.21 km/s</code>)！喷出的工质会在冥王星引力下重新落回地表，净推力严格为零！';
    } else if (massRatio > 0.25) {
      alertBox.innerHTML = '⚠️ <strong>化学燃料灾难：</strong> 在 <code>v_e = ' + veKms + ' km/s</code>（有效排气速度 <code>' + veEff.toFixed(2) + ' km/s</code>）下产生 <code>' + dvKms.toFixed(2) + ' km/s</code> 的速度增量，需消耗冥王星 <strong>' + pct + '%</strong> 的自身质量作为推进剂！必须换用高比冲核聚变行星发动机。';
    } else {
      alertBox.innerHTML = '✅ <strong>行星发动机可行区间：</strong> 采用 <code>v_e = ' + veKms + ' km/s</code> 的高比冲推进系统，完成 <code>' + dvKms.toFixed(2) + ' km/s</code> 变轨仅需消耗冥王星 <strong>' + pct + '%</strong> 的冰层质量。';
    }
  }

  function formatSci(num) {
    if (num === 0) return '0.00';
    const exp = Math.floor(Math.log10(Math.abs(num)));
    const mant = num / Math.pow(10, exp);
    return mant.toFixed(2) + '×10^' + exp;
  }

  function triggerImpulse() {
    const dvKms = parseFloat(document.getElementById('dvMagSlider').value);
    const angDeg = parseFloat(document.getElementById('dvAngleSlider').value);
    const angRad = angDeg * Math.PI / 180;

    const speed = Math.hypot(pluto.vx, pluto.vy);
    let ux = 1, uy = 0;
    if (speed > 1e-9) {
      ux = pluto.vx / speed;
      uy = pluto.vy / speed;
    }
    const dirX = ux * Math.cos(angRad) - uy * Math.sin(angRad);
    const dirY = ux * Math.sin(angRad) + uy * Math.cos(angRad);

    const dvAuDay = dvKms * KMS_TO_AUDAY;
    pluto.vx += dirX * dvAuDay;
    pluto.vy += dirY * dvAuDay;
    totalDeltaVApplied += dvKms;
  }

  function brakeToCircular() {
    const r = Math.hypot(pluto.x, pluto.y);
    const vCirc = Math.sqrt(G_GAUSS / r);
    const rx = pluto.x / r;
    const ry = pluto.y / r;
    const newVx = -vCirc * ry;
    const newVy = vCirc * rx;
    const dvAuDay = Math.hypot(newVx - pluto.vx, newVy - pluto.vy);
    totalDeltaVApplied += dvAuDay * AUDAY_TO_KMS;
    pluto.vx = newVx;
    pluto.vy = newVy;
  }

  function manualSaturnCapture() {
    const sat = getSaturn();
    const orbitR = 0.14;
    pluto.x = sat.x + orbitR;
    pluto.y = sat.y;
    const vOrbitSat = Math.sqrt(sat.gm / orbitR);
    pluto.vx = sat.vx;
    pluto.vy = sat.vy + vOrbitSat;
    totalDeltaVApplied += 6.85;
    saturnCapturedFlag = true;
    cameraScale = 42.0;
    setCameraFocus('saturn');
  }

  function toggleContinuousThrust(mode) {
    continuousThrustMode = mode;
    updateThrustButtons();
  }

  function updateThrustButtons() {
    document.getElementById('btnRetroBurn').classList.toggle('active', continuousThrustMode === 'retro');
    document.getElementById('btnSunBurn').classList.toggle('active', continuousThrustMode === 'sunward');
    const label = document.getElementById('contThrustVal');
    if (continuousThrustMode === 'retro') label.textContent = '逆向减速中';
    else if (continuousThrustMode === 'sunward') label.textContent = '向日推进中';
    else label.textContent = '关闭';
  }

  function setCameraFocus(target) {
    cameraFocus = target;
    document.getElementById('camSun').classList.toggle('active', target === 'sun');
    document.getElementById('camPluto').classList.toggle('active', target === 'pluto');
    document.getElementById('camSaturn').classList.toggle('active', target === 'saturn');
    const mapNames = { sun: '太阳系全景', pluto: '追踪冥王星', saturn: '追踪土星' };
    document.getElementById('cameraFocusVal').textContent = mapNames[target];
    cameraOffsetX = 0;
    cameraOffsetY = 0;
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('playPauseBtn').textContent = isPlaying ? '⏸ 暂停模拟' : '▶️ 继续模拟';
  }

  function resetSimulation() {
    applyPreset(currentPreset);
  }

  function clearTrails() {
    pluto.trail = [];
  }

  function zoomCanvas(factor) {
    cameraScale = Math.max(1.2, Math.min(220, cameraScale * factor));
  }

  let isDragging = false, lastMouseX = 0, lastMouseY = 0;
  canvas.addEventListener('pointerdown', e => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!isDragging) return;
    cameraOffsetX += e.clientX - lastMouseX;
    cameraOffsetY += e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { isDragging = false; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    zoomCanvas(factor);
  }, { passive: false });

  function computePlutoAcceleration(x, y) {
    const rSunSq = x * x + y * y + 1e-8;
    const rSun = Math.sqrt(rSunSq);
    let ax = -G_GAUSS * x / (rSunSq * rSun);
    let ay = -G_GAUSS * y / (rSunSq * rSun);

    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const dx = x - p.x;
      const dy = y - p.y;
      const dSq = dx * dx + dy * dy + 1e-6;
      const d = Math.sqrt(dSq);
      ax -= p.gm * dx / (dSq * d);
      ay -= p.gm * dy / (dSq * d);
    }

    if (continuousThrustMode === 'retro') {
      const v = Math.hypot(pluto.vx, pluto.vy);
      if (v > 1e-8) {
        const thrustAcc = 0.015 * KMS_TO_AUDAY;
        ax -= (pluto.vx / v) * thrustAcc;
        ay -= (pluto.vy / v) * thrustAcc;
      }
    } else if (continuousThrustMode === 'sunward') {
      const thrustAcc = 0.015 * KMS_TO_AUDAY;
      ax -= (x / rSun) * thrustAcc;
      ay -= (y / rSun) * thrustAcc;
    }

    return { ax, ay };
  }

  function stepPhysics() {
    const totalDt = parseFloat(document.getElementById('timeScaleSlider').value);
    const sat = getSaturn();
    const distSatNow = Math.hypot(pluto.x - sat.x, pluto.y - sat.y);

    const subSteps = distSatNow < 1.2 ? 24 : 8;
    const dt = totalDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        const omega = p.v / p.a;
        p.angle += omega * dt;
        p.x = p.a * Math.cos(p.angle);
        p.y = p.a * Math.sin(p.angle);
        p.vx = -p.v * Math.sin(p.angle);
        p.vy = p.v * Math.cos(p.angle);
      }

      const acc0 = computePlutoAcceleration(pluto.x, pluto.y);
      const nextX = pluto.x + pluto.vx * dt + 0.5 * acc0.ax * dt * dt;
      const nextY = pluto.y + pluto.vy * dt + 0.5 * acc0.ay * dt * dt;
      const acc1 = computePlutoAcceleration(nextX, nextY);

      pluto.x = nextX;
      pluto.y = nextY;
      pluto.vx += 0.5 * (acc0.ax + acc1.ax) * dt;
      pluto.vy += 0.5 * (acc0.ay + acc1.ay) * dt;

      if (continuousThrustMode !== 'off') {
        totalDeltaVApplied += 0.015 * dt;
      }

      const autoCap = document.getElementById('autoCaptureCheck').checked;
      const dxSat = pluto.x - sat.x;
      const dySat = pluto.y - sat.y;
      const dSat = Math.hypot(dxSat, dySat);

      if (autoCap && !saturnCapturedFlag && dSat < 0.18) {
        const vCircSat = Math.sqrt(sat.gm / dSat);
        const tx = -dySat / dSat;
        const ty = dxSat / dSat;
        const targetVx = sat.vx + tx * vCircSat * 0.96;
        const targetVy = sat.vy + ty * vCircSat * 0.96;
        const dvBrakeKms = Math.hypot(targetVx - pluto.vx, targetVy - pluto.vy) * AUDAY_TO_KMS;
        totalDeltaVApplied += dvBrakeKms;
        pluto.vx = targetVx;
        pluto.vy = targetVy;
        saturnCapturedFlag = true;
      }
    }

    simDays += totalDt;
    pluto.trail.push({ x: pluto.x, y: pluto.y });
    if (pluto.trail.length > pluto.maxTrail) {
      pluto.trail.shift();
    }
  }

  function updateTelemetryUI() {
    const rSun = Math.hypot(pluto.x, pluto.y);
    const vSunAuday = Math.hypot(pluto.vx, pluto.vy);
    const vSunKms = vSunAuday * AUDAY_TO_KMS;
    const vEscSunKms = Math.sqrt(2 * G_GAUSS / rSun) * AUDAY_TO_KMS;

    const specEnergySun = 0.5 * vSunAuday * vSunAuday - G_GAUSS / rSun;
    const hSun = pluto.x * pluto.vy - pluto.y * pluto.vx;
    const eccSun = Math.sqrt(Math.max(0, 1 + (2 * specEnergySun * hSun * hSun) / (G_GAUSS * G_GAUSS)));
    const smaSun = -G_GAUSS / (2 * specEnergySun);

    const specEnergySunJPerKg = (0.5 * Math.pow(vSunKms * 1000, 2)) - (1.32712e20 / (rSun * AU_KM * 1000));
    const totalEnergySunJ = PLUTO_MASS_KG * specEnergySunJPerKg;

    const sat = getSaturn();
    const dxSat = pluto.x - sat.x;
    const dySat = pluto.y - sat.y;
    const rSat = Math.hypot(dxSat, dySat);
    const dvxSat = pluto.vx - sat.vx;
    const dvySat = pluto.vy - sat.vy;
    const vRelSatAuday = Math.hypot(dvxSat, dvySat);
    const vRelSatKms = vRelSatAuday * AUDAY_TO_KMS;
    const vEscSatKms = Math.sqrt(2 * sat.gm / rSat) * AUDAY_TO_KMS;

    const specEnergySat = 0.5 * vRelSatAuday * vRelSatAuday - sat.gm / rSat;
    const satMassMult = parseFloat(document.getElementById('saturnMassSlider').value);
    const specEnergySatJPerKg = (0.5 * Math.pow(vRelSatKms * 1000, 2)) - (3.7931e16 * satMassMult / (rSat * AU_KM * 1000));
    const totalEnergySatJ = PLUTO_MASS_KG * specEnergySatJPerKg;

    const hillRadiusAu = sat.a * Math.pow((SATURN_MASS_RATIO_BASE * satMassMult) / 3, 1 / 3);

    document.getElementById('simTimeYears').textContent = (simDays / 365.25).toFixed(2);
    document.getElementById('hudDistSun').textContent = rSun.toFixed(2);
    document.getElementById('hudDistSaturn').textContent = rSat.toFixed(3);
    document.getElementById('hudEnergySun').textContent = (totalEnergySunJ >= 0 ? '+' : '') + totalEnergySunJ.toExponential(2);
    document.getElementById('hudEnergySat').textContent = (totalEnergySatJ >= 0 ? '+' : '') + totalEnergySatJ.toExponential(2);

    document.getElementById('telVelSun').textContent = vSunKms.toFixed(2) + ' km/s';
    document.getElementById('telEscSun').textContent = '太阳逃逸速度: ' + vEscSunKms.toFixed(2) + ' km/s';
    document.getElementById('telEccSun').textContent = eccSun.toFixed(3);
    document.getElementById('telSmaSun').textContent = smaSun > 0 ? ('半长轴 a: ' + smaSun.toFixed(2) + ' AU') : ('双曲半实轴: ' + Math.abs(smaSun).toFixed(2) + ' AU');

    document.getElementById('telVelSat').textContent = vRelSatKms.toFixed(2) + ' km/s';
    document.getElementById('telEscSat').textContent = '土星局部逃逸: ' + vEscSatKms.toFixed(2) + ' km/s';
    document.getElementById('telTotalDv').textContent = totalDeltaVApplied.toFixed(2) + ' km/s';
    const totalKeUsed = 0.5 * PLUTO_MASS_KG * Math.pow(totalDeltaVApplied * 1000, 2);
    document.getElementById('telTotalEnergy').textContent = formatSci(totalKeUsed) + ' J';

    const badge = document.getElementById('orbitStateBadge');
    if (rSat < hillRadiusAu && specEnergySat < 0) {
      badge.className = 'status-badge captured';
      badge.textContent = '🪐 当前状态：已被土星引力捕获（成为土星卫星，r = ' + (rSat * 149.6).toFixed(1) + '百万 km）';
    } else if (specEnergySun >= 0) {
      badge.className = 'status-badge escaped';
      const vInf = Math.sqrt(2 * specEnergySun) * AUDAY_TO_KMS;
      badge.textContent = '🚀 当前状态：太阳系双曲逃逸轨道 (e = ' + eccSun.toFixed(2) + ', v_∞ = ' + vInf.toFixed(2) + ' km/s)';
    } else {
      badge.className = 'status-badge bound';
      badge.textContent = '☀️ 当前状态：太阳系椭圆束缚轨道 (e = ' + eccSun.toFixed(3) + ', a = ' + smaSun.toFixed(1) + ' AU)';
    }
  }

  function renderCanvas() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    let focusX = 0, focusY = 0;
    if (cameraFocus === 'pluto') {
      focusX = pluto.x;
      focusY = pluto.y;
    } else if (cameraFocus === 'saturn') {
      focusX = getSaturn().x;
      focusY = getSaturn().y;
    }

    const cx = width / 2 + cameraOffsetX - focusX * cameraScale;
    const cy = height / 2 + cameraOffsetY - focusY * cameraScale;

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let deg = 0; deg <= 360; deg += 3) {
      const rad = deg * Math.PI / 180;
      const rRef = (39.236 * (1 - 0.2444 * 0.2444)) / (1 + 0.2444 * Math.cos(rad - 0.35));
      const px = cx + rRef * Math.cos(rad) * cameraScale;
      const py = cy + rRef * Math.sin(rad) * cameraScale;
      if (deg === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    planets.forEach(p => {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, p.a * cameraScale, 0, Math.PI * 2);
      ctx.stroke();

      const px = cx + p.x * cameraScale;
      const py = cy + p.y * cameraScale;

      if (p.isSaturn && document.getElementById('showHillCheck').checked) {
        const satMassMult = parseFloat(document.getElementById('saturnMassSlider').value);
        const hillAu = p.a * Math.pow((SATURN_MASS_RATIO_BASE * satMassMult) / 3, 1 / 3);
        const hillPx = Math.max(4, hillAu * cameraScale);
        ctx.save();
        ctx.fillStyle = 'rgba(192, 132, 252, 0.10)';
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(px, py, hillPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (p.isSaturn) {
        ctx.save();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(px, py, p.radius * 2.1, p.radius * 0.85, 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText(p.name, px + p.radius + 4, py + 3);
    });

    const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.35, '#fde047');
    sunGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    if (pluto.trail.length > 1) {
      ctx.save();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#f43f5e';
      ctx.beginPath();
      for (let i = 0; i < pluto.trail.length; i++) {
        const pt = pluto.trail[i];
        const tx = cx + pt.x * cameraScale;
        const ty = cy + pt.y * cameraScale;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.restore();
    }

    const plutoPx = cx + pluto.x * cameraScale;
    const plutoPy = cy + pluto.y * cameraScale;

    const vLen = Math.hypot(pluto.vx, pluto.vy);
    if (vLen > 1e-8) {
      const ux = pluto.vx / vLen;
      const uy = pluto.vy / vLen;
      const arrowLen = Math.min(65, Math.max(24, vLen * AUDAY_TO_KMS * 4.5));
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(plutoPx, plutoPy);
      ctx.lineTo(plutoPx + ux * arrowLen, plutoPy + uy * arrowLen);
      ctx.stroke();

      const dvKms = parseFloat(document.getElementById('dvMagSlider').value);
      const angRad = parseFloat(document.getElementById('dvAngleSlider').value) * Math.PI / 180;
      if (dvKms > 0.05) {
        const dirX = ux * Math.cos(angRad) - uy * Math.sin(angRad);
        const dirY = ux * Math.sin(angRad) + uy * Math.cos(angRad);
        const dvLen = Math.min(55, dvKms * 5.0);
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(plutoPx, plutoPy);
        ctx.lineTo(plutoPx + dirX * dvLen, plutoPy + dirY * dvLen);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(plutoPx, plutoPy, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillText('冥王星 (Pluto)', plutoPx + 8, plutoPy - 6);
  }

  function animate() {
    if (isPlaying) {
      stepPhysics();
    }
    updateTelemetryUI();
    renderCanvas();
    animFrameId = requestAnimationFrame(animate);
  }

  function bindEvents() {
    document.getElementById('preset1').addEventListener('click', () => applyPreset(1));
    document.getElementById('preset2').addEventListener('click', () => applyPreset(2));
    document.getElementById('preset3').addEventListener('click', () => applyPreset(3));
    document.getElementById('preset4').addEventListener('click', () => applyPreset(4));
    document.getElementById('preset5').addEventListener('click', () => applyPreset(5));

    document.getElementById('dvMagSlider').addEventListener('input', updateControlLabels);
    document.getElementById('dvAngleSlider').addEventListener('input', updateControlLabels);
    document.getElementById('btnTriggerImpulse').addEventListener('click', triggerImpulse);
    document.getElementById('btnCircularize').addEventListener('click', brakeToCircular);

    document.getElementById('engineTypeSelect').addEventListener('change', updateEngineCalculation);
    document.getElementById('btnRetroBurn').addEventListener('click', () => toggleContinuousThrust('retro'));
    document.getElementById('btnSunBurn').addEventListener('click', () => toggleContinuousThrust('sunward'));
    document.getElementById('btnStopBurn').addEventListener('click', () => toggleContinuousThrust('off'));

    document.getElementById('saturnMassSlider').addEventListener('input', updateSaturnParams);
    document.getElementById('showHillCheck').addEventListener('change', renderCanvas);
    document.getElementById('btnManualCapture').addEventListener('click', manualSaturnCapture);

    document.getElementById('timeScaleSlider').addEventListener('input', updateControlLabels);
    document.getElementById('camSun').addEventListener('click', () => setCameraFocus('sun'));
    document.getElementById('camPluto').addEventListener('click', () => setCameraFocus('pluto'));
    document.getElementById('camSaturn').addEventListener('click', () => setCameraFocus('saturn'));

    document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
    document.getElementById('btnResetSim').addEventListener('click', resetSimulation);
    document.getElementById('btnZoomIn').addEventListener('click', () => zoomCanvas(1.25));
    document.getElementById('btnZoomOut').addEventListener('click', () => zoomCanvas(0.8));
    document.getElementById('btnClearTrails').addEventListener('click', clearTrails);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('load', () => {
    bindEvents();
    resizeCanvas();
    applyPreset(1);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(animate);
  });
