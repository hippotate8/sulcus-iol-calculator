import { calculate, MODELS } from './core.mjs';

const $ = (id) => document.getElementById(id);
const fieldIds = ['al', 'acd', 'k1', 'k2', 'target'];
const otherIds = ['other-a0', 'other-a1', 'other-a2'];

function blankResults() {
  for (const id of ['mod-power', 'mod-ref', 'orig-power', 'orig-ref']) $(id).textContent = '—';
  $('mod-table').innerHTML = '';
  $('orig-table').innerHTML = '';
  $('result-area').hidden = true;
}
function settings() {
  const type = $('model').value;
  const constants = structuredClone(MODELS[type]);
  if (type === 'other') {
    for (const key of ['a0', 'a1', 'a2']) constants.original[key] = Number($(`other-${key}`).value);
  }
  return constants;
}
function values() {
  return Object.fromEntries(fieldIds.map(id => [id, Number($(id).value)]));
}
const fmtRef = n => `${n >= 0 ? '+' : ''}${n.toFixed(2)} D`;
const fmtPower = n => `${n.toFixed(1)} D`;
function renderTable(id, rows, power) {
  $(id).innerHTML = rows.map(row => `<tr class="${row.power === power ? 'closest' : ''}"><td>${row.power.toFixed(1)}</td><td>${fmtRef(row.refraction)}</td></tr>`).join('');
}
function updateType() {
  const other = $('model').value === 'other';
  $('other-constants').hidden = !other;
  $('mod-card').hidden = other;
  $('mod-table-panel').hidden = other;
  $('results-grid').classList.toggle('single', other);
  $('tables-grid').classList.toggle('single', other);
  $('error').hidden = true;
  blankResults();
}
function calculateOnClick() {
  $('error').hidden = true;
  blankResults();
  try {
    if (!fieldIds.every(id => $(id).value.trim() !== '')) throw Error('AL, K1, K2, ACD, Target Refraction을 모두 입력해 주세요.');
    const other = $('model').value === 'other';
    if (other && !otherIds.every(id => $(id).value.trim() !== '')) throw Error('Other IOL의 Haigis 상수 a0, a1, a2를 모두 입력해 주세요.');
    const r = calculate(values(), settings());
    if (!other) {
      $('mod-power').textContent = fmtPower(r.modified.recommendedPower);
      $('mod-ref').textContent = fmtRef(r.modified.recommendedRefraction);
      renderTable('mod-table', r.modified.table, r.modified.recommendedPower);
    }
    $('orig-power').textContent = fmtPower(r.original.recommendedPower);
    $('orig-ref').textContent = fmtRef(r.original.recommendedRefraction);
    renderTable('orig-table', r.original.table, r.original.recommendedPower);
    $('result-area').hidden = false;
  } catch (ex) {
    $('error').textContent = ex.message;
    $('error').hidden = false;
  }
}
$('model').addEventListener('change', updateType);
[...fieldIds, ...otherIds].forEach(id => $(id).addEventListener('input', () => {
  $('error').hidden = true;
  blankResults();
}));
$('calculate').addEventListener('click', calculateOnClick);
$('reset').addEventListener('click', () => {
  [...fieldIds, ...otherIds].forEach(id => { $(id).value = ''; });
  $('model').value = 'za9003';
  updateType();
});
updateType();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
