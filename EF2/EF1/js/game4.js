// game4.js — fast travel + settings (self-contained, loads after game1-3).

// ---- Fast travel ----
const TOWNS = [
  ['Greenrest Vale', 96, 128],
  ['Pineholt', 96, 70],
  ['Frostmere', 100, 22],
  ['Thornwood', 152, 74],
  ['Cinderforge', 154, 132],
  ['Sablemarsh', 36, 130],
  ['Ashfall Wastes', 42, 54],
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
}
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  const modalOpen = !document.getElementById('modal').classList.contains('hidden');
  if (k === 't' && !modalOpen) fastTravelMenu();
});
