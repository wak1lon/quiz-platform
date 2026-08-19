/**
 * QUIZ ADV — correção de "Opções com imagem"
 *
 * O que este módulo faz:
 * 1) transforma o upload local da opção em imagem incorporada ao próprio quiz;
 * 2) adiciona um campo "Nome da opção" para cada imagem;
 * 3) mantém LABEL e VALUE iguais ao nome, para o nome escolhido chegar em answers,
 *    Resultados e CSV sem depender de outra alteração;
 * 4) comprime/redimensiona a imagem antes de gravá-la no quiz;
 * 5) preserva peso e ícone já configurados na linha da opção.
 *
 * Instalação:
 * - salvar em: assets/js/image-option-publish-fix.js
 * - carregar em admin/index.html, DEPOIS de admin.js:
 *   <script type="module" src="../assets/js/image-option-publish-fix.js"></script>
 */

const APP_SELECTOR = '#appContent';
const OPTIONS_EDITOR_ID = 'optionsEditor';
const UPLOAD_SELECTOR = 'input[data-option-upload]';
const PATCHED_ATTR = 'data-qp-image-option-patched';

const IMAGE_MAX_SIDE = 480;
const IMAGE_TARGET_CHARS = 52000;
const IMAGE_HARD_LIMIT_CHARS = 70000;
const TOTAL_IMAGE_BUDGET_CHARS = 620000;

let scheduled = false;

function scheduleScan() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    scanEditor();
  });
}

function splitOptionLine(line) {
  const parts = String(line || '').split('|');
  return {
    label: (parts[0] || '').trim(),
    value: (parts[1] || '').trim(),
    weight: (parts[2] || '0').trim(),
    icon: (parts[3] || '').trim(),
    image: parts.slice(4).join('|').trim()
  };
}

function buildOptionLine(option) {
  return [
    option.label || '',
    option.value || '',
    option.weight || '0',
    option.icon || '',
    option.image || ''
  ].join('|');
}

function getOptionRows(textarea) {
  return String(textarea.value || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(splitOptionLine);
}

function commitRows(textarea, rows) {
  textarea.value = rows.map(buildOptionLine).join('\n');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível processar esta imagem.'));
    img.src = dataUrl;
  });
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file) {
  if (!file) throw new Error('Selecione uma imagem.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Formato não permitido. Use JPG, PNG ou WEBP.');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 2 MB antes da otimização.');
  }

  const originalDataUrl = await readAsDataUrl(file);
  const img = await loadImage(originalDataUrl);

  const scale = Math.min(
    1,
    IMAGE_MAX_SIDE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
  );

  const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Seu navegador não conseguiu otimizar a imagem.');

  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.76;
  let dataUrl = canvas.toDataURL('image/webp', quality);

  while (dataUrl.length > IMAGE_TARGET_CHARS && quality > 0.36) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/webp', quality);
  }

  if (dataUrl.length > IMAGE_HARD_LIMIT_CHARS) {
    const ratio = Math.sqrt(IMAGE_TARGET_CHARS / dataUrl.length);
    const smaller = document.createElement('canvas');
    smaller.width = Math.max(1, Math.round(width * ratio));
    smaller.height = Math.max(1, Math.round(height * ratio));

    const smallerCtx = smaller.getContext('2d', { alpha: true });
    if (!smallerCtx) throw new Error('Seu navegador não conseguiu reduzir a imagem.');

    smallerCtx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
    dataUrl = smaller.toDataURL('image/webp', 0.58);
  }

  if (dataUrl.length > IMAGE_HARD_LIMIT_CHARS) {
    throw new Error(
      'A imagem continua pesada demais para publicação. Use uma imagem mais simples ou menor.'
    );
  }

  return dataUrl;
}

function getOptionUploadFields() {
  const uploads = [...document.querySelectorAll(UPLOAD_SELECTOR)];
  return uploads
    .map(upload => upload.closest('.field'))
    .filter(Boolean);
}

function setStatus(field, text, isError = false) {
  let status = field.querySelector('[data-qp-image-option-status]');
  if (!status) {
    status = document.createElement('small');
    status.dataset.qpImageOptionStatus = '1';
    status.style.display = 'block';
    status.style.marginTop = '6px';
    status.style.fontSize = '11px';
    field.appendChild(status);
  }
  status.textContent = text;
  status.style.color = isError ? 'var(--danger, #ef4444)' : 'var(--success, #10b981)';
}

function ensurePreview(field, src, name) {
  let preview = field.querySelector('img[data-qp-option-preview], img');
  if (!preview) {
    preview = document.createElement('img');
    preview.dataset.qpOptionPreview = '1';
    preview.style.width = '110px';
    preview.style.height = '110px';
    preview.style.objectFit = 'cover';
    preview.style.borderRadius = '12px';
    preview.style.marginTop = '8px';
    preview.style.display = 'block';
    field.appendChild(preview);
  }
  preview.src = src;
  preview.alt = name || 'Imagem da opção';
}

function imageCharsTotal(rows) {
  return rows.reduce((sum, row) => sum + String(row.image || '').length, 0);
}

function syncNameIntoRow(textarea, index, name) {
  const rows = getOptionRows(textarea);
  if (!rows[index]) return;

  const clean = String(name || '').trim() || `Opção ${index + 1}`;

  // Intencional: VALUE = LABEL.
  // Assim o nome escolhido chega diretamente em answers e no CSV atual.
  rows[index].label = clean;
  rows[index].value = clean;

  commitRows(textarea, rows);
}

async function saveImageIntoRow(textarea, index, file, field) {
  const rows = getOptionRows(textarea);
  if (!rows[index]) throw new Error('A opção não foi encontrada no editor.');

  setStatus(field, 'Otimizando imagem...');

  const dataUrl = await optimizeImage(file);
  rows[index].image = dataUrl;

  const total = imageCharsTotal(rows);
  if (total > TOTAL_IMAGE_BUDGET_CHARS) {
    throw new Error(
      'Este quiz já possui muitas imagens incorporadas. Reduza a quantidade ou o tamanho das imagens.'
    );
  }

  const cleanName = rows[index].label || `Opção ${index + 1}`;
  rows[index].label = cleanName;
  rows[index].value = cleanName;

  commitRows(textarea, rows);
  ensurePreview(field, dataUrl, cleanName);
  setStatus(field, 'Imagem incorporada ao quiz. Salve/Publice para enviar junto com o quiz.');
}

function patchOptionField(field, index, textarea) {
  if (field.hasAttribute(PATCHED_ATTR)) return;
  field.setAttribute(PATCHED_ATTR, '1');

  const upload = field.querySelector(UPLOAD_SELECTOR);
  if (!upload) return;

  const rows = getOptionRows(textarea);
  const row = rows[index] || {
    label: `Opção ${index + 1}`,
    value: `Opção ${index + 1}`,
    weight: '0',
    icon: '',
    image: ''
  };

  const oldLabel = field.querySelector('label');

  const nameWrap = document.createElement('div');
  nameWrap.style.marginBottom = '8px';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Nome da opção / imagem';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = row.label || `Opção ${index + 1}`;
  nameInput.placeholder = `Ex.: Opção ${index + 1}`;
  nameInput.dataset.qpImageOptionName = String(index);

  nameWrap.appendChild(nameLabel);
  nameWrap.appendChild(nameInput);

  if (oldLabel) {
    oldLabel.textContent = 'Imagem da opção';
    field.insertBefore(nameWrap, oldLabel);
  } else {
    field.insertBefore(nameWrap, upload);
  }

  if (row.image) {
    ensurePreview(field, row.image, row.label);
  }

  nameInput.addEventListener('input', () => {
    syncNameIntoRow(textarea, index, nameInput.value);
    if (oldLabel) oldLabel.textContent = `Imagem — ${nameInput.value || `Opção ${index + 1}`}`;
  });

  // O código antigo usa .onchange. Substituímos deliberadamente para que
  // o upload passe a entrar no objeto real do quiz, e não só no preview local.
  upload.onchange = async () => {
    const file = upload.files?.[0];
    if (!file) return;

    upload.disabled = true;
    nameInput.disabled = true;

    try {
      await saveImageIntoRow(textarea, index, file, field);
    } catch (error) {
      console.error('[QUIZ ADV] Falha na imagem da opção:', error);
      setStatus(field, error?.message || 'Não foi possível salvar a imagem.', true);
      upload.value = '';
    } finally {
      upload.disabled = false;
      nameInput.disabled = false;
    }
  };
}

function scanEditor() {
  const textarea = document.getElementById(OPTIONS_EDITOR_ID);
  if (!textarea) return;

  const fields = getOptionUploadFields();
  if (!fields.length) return;

  fields.forEach((field, index) => patchOptionField(field, index, textarea));
}

if (typeof document !== 'undefined') {
  const app = document.querySelector(APP_SELECTOR) || document.body;
  const observer = new MutationObserver(() => scheduleScan());
  observer.observe(app, { childList: true, subtree: true });

  scheduleScan();

  console.info(
    '[QUIZ ADV] Correção de opções com imagem carregada: upload incorporado + nome retornando no resultado.'
  );
}

export { splitOptionLine, buildOptionLine, getOptionRows, commitRows, syncNameIntoRow };
