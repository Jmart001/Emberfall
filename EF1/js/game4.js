// game4.js — fast travel + settings (self-contained, loads after game1-3).

// ---- Fast travel ----
const TOWNS = [
  ['Greenrest Vale', 174, 44],
  ['Pineholt', 87, 67],
  ['Frostmere', 88, 18],
  ['Thornwood', 111, 64],
  ['Cinderforge', 119, 67],
  ['Sablemarsh', 10, 122],
  ['Ashfall Wastes', 12, 36],
];
function fastTravel(x, y, name) {
  if (inDungeon(player.x, player.y))
    return message('You must climb out of the Barrow before travelling.', 'bad');
  closeModal();
  player.x = x;
  player.y = y;
  player.drawX = x;
  player.drawY = y;
  path = [];
  moveSegment = null;
  destination = null;
  combat = null;
  skilling = null;
  camera.ready = false; // snap the camera to the new location next frame
  message(`You travel to ${name}.`, 'game');
  checkRegion();
  updateUI();
  renderPanel();
  save();
}
function fastTravelMenu() {
  const rows = TOWNS.map(([name, x, y]) => {
    const disc = player.discoveredRegions[name];
    return disc
      ? [`Travel to ${name}`, () => fastTravel(x, y, name)]
      : [`${name} — undiscovered`, () => message('Discover this region on foot first.', 'bad'), 'disabled'];
  });
  rows.push(['Close', closeModal]);
  showModal('Fast Travel', 'Instantly travel to any town you have already discovered.', rows);
}

// ---- Settings ----
function efLoadSettings() {
  try {
    return JSON.parse(localStorage.getItem('emberfall-ef1-settings') || '{}');
  } catch (e) {
    return {};
  }
}
function efSaveSettings() {
  try {
    localStorage.setItem('emberfall-ef1-settings', JSON.stringify(efSettings));
  } catch (e) {}
}
function applyUiScale(scale) {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.style.zoom = scale === 'large' ? '1.14' : scale === 'small' ? '0.9' : '';
}
const efSettings = efLoadSettings();
applyUiScale(efSettings.uiScale || 'normal');
if (efSettings.sound === false && window.SFX && !SFX.isMuted()) SFX.toggle();
function applyCoordHud(on) {
  const el = document.getElementById('coordHud');
  if (el) el.style.display = on ? '' : 'none';
}
function toggleCoordHud() {
  efSettings.coordHud = efSettings.coordHud === false ? true : false;
  applyCoordHud(efSettings.coordHud);
  efSaveSettings();
  message(`Tile reader ${efSettings.coordHud ? 'shown' : 'hidden'}.`, 'game');
}
applyCoordHud(efSettings.coordHud !== false);
function openSettings() {
  const muted = window.SFX ? SFX.isMuted() : true,
    scale = efSettings.uiScale || 'normal';
  showModal('Settings', 'Adjust sound and interface size. Changes are saved automatically.', [
    [
      muted ? '🔇 Sound: OFF — click to enable' : '🔊 Sound: ON — click to mute',
      () => {
        if (window.SFX) SFX.toggle();
        efSettings.sound = window.SFX ? !SFX.isMuted() : true;
        efSaveSettings();
        openSettings();
      },
    ],
    [
      'UI size: Small',
      () => {
        efSettings.uiScale = 'small';
        applyUiScale('small');
        efSaveSettings();
        openSettings();
      },
      scale === 'small' ? 'selected' : '',
    ],
    [
      'UI size: Normal',
      () => {
        efSettings.uiScale = 'normal';
        applyUiScale('normal');
        efSaveSettings();
        openSettings();
      },
      scale === 'normal' ? 'selected' : '',
    ],
    [
      'UI size: Large',
      () => {
        efSettings.uiScale = 'large';
        applyUiScale('large');
        efSaveSettings();
        openSettings();
      },
      scale === 'large' ? 'selected' : '',
    ],
    [
      efSettings.coordHud === false ? '🗺️ Tile reader: OFF — click to show' : '🗺️ Tile reader: ON — click to hide',
      () => {
        toggleCoordHud();
        openSettings();
      },
    ],
    [
      'Save game now',
      () => {
        save();
        message('Game saved.', 'good');
      },
    ],
    ['Close', closeModal],
  ]);
}

// ---- Wiring ----
{
  const ft = document.getElementById('fastTravelBtn');
  if (ft) ft.onclick = fastTravelMenu;
  const st = document.getElementById('settingsBtn');
  if (st) st.onclick = openSettings;
  const dc = document.getElementById('deathContinue');
  if (dc) dc.onclick = closeDeathScreen;
}
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  const modalOpen = !document.getElementById('modal').classList.contains('hidden');
  if (k === 't' && !modalOpen) fastTravelMenu();
  else if (k === 'c' && !modalOpen) toggleCoordHud();
});
