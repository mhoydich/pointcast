(() => {
  'use strict';
  document.documentElement.classList.add('has-js');
  const answers = {
    context: {
      correct: 'appearance',
      feedback: {
        'wrong-file': 'Try again. Identical values can produce different perceived appearances in different surrounds. First distinguish the unchanged value from your observation.',
        appearance: 'Yes. Context affects appearance even when the encoded color stays fixed. The observation is useful; it is not evidence that the file changed or that a print is certified.',
        certified: 'Try again. A screen comparison cannot establish which physical print is accurate. A defined reference, viewing conditions and a proof are still needed.'
      }
    },
    material: {
      correct: 'proof',
      feedback: {
        same: 'Try again. A color name does not cancel the effect of the paper. Pantone explains that coated and uncoated stock can produce different appearances.',
        brighten: 'Try again. Changing your preview does not define the paper, ink or production conditions. Describe the stock and request a proof on the actual material.',
        proof: 'Yes. Name the new stock and finish, agree the process, and review a proof. The same ink recipe can look different on a different surface.'
      }
    },
    handoff: {
      correct: 'conditions',
      feedback: {
        enough: 'Try again. This HEX value is a digital sRGB reference, not a universal ink recipe. Production needs a process, material, reference and approval conditions.',
        conditions: 'Yes. Give the maker a sample ID and revision, process and material, a reference, viewing conditions and a proof/approval plan. A name or number alone leaves important decisions open.',
        pantone: 'Try again. Pantone is one color system; spot ink is a production method, not an exclusive brand. Even a Pantone specification still needs material and approval context.'
      }
    }
  };
  const quizzes = [...document.querySelectorAll('.quiz')];
  const checked = new Map();
  const quizProgress = document.getElementById('quiz-progress');
  const updateQuizProgress = () => {
    const correct = [...checked.values()].filter(Boolean).length;
    quizProgress.textContent = `${checked.size} of 3 questions checked · ${correct} of 3 understood so far. Revise any answer to keep practicing.`;
  };
  quizzes.forEach((form) => {
    const question = form.dataset.question;
    const feedback = form.querySelector('.feedback');
    form.querySelector('button').disabled = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = new FormData(form).get(question);
      if (!value) {
        feedback.textContent = 'Choose one answer first, then check your reasoning.';
        form.querySelector('input').focus();
        return;
      }
      const correct = value === answers[question].correct;
      checked.set(question, correct);
      form.dataset.result = correct ? 'correct' : 'retry';
      feedback.textContent = answers[question].feedback[value];
      updateQuizProgress();
    });
    form.addEventListener('change', () => {
      checked.delete(question);
      delete form.dataset.result;
      feedback.textContent = 'Answer selected. Check your reasoning when you are ready.';
      updateQuizProgress();
    });
  });
  const resetChecks = document.getElementById('reset-checks');
  resetChecks.disabled = false;
  resetChecks.addEventListener('click', () => {
    quizzes.forEach((form) => {
      form.reset();
      delete form.dataset.result;
      form.querySelector('.feedback').textContent = 'Choose an answer and check your reasoning.';
    });
    checked.clear();
    quizProgress.textContent = 'Practice answers reset. 0 of 3 questions checked.';
  });

  const palettes = {
    harbor: {name: 'Harbor signal', colors: ['#25251F', '#E75737', '#D9D4C5', '#A9C5CD']},
    workshop: {name: 'Workshop morning', colors: ['#303D34', '#C8D85C', '#C5A981', '#F1EEE6']},
    evening: {name: 'Evening notice', colors: ['#24264B', '#DA8DBB', '#B4BDE0', '#F1EEE6']}
  };
  const briefForm = document.getElementById('brief-form');
  const output = document.getElementById('brief-output');
  const swatches = document.getElementById('palette-swatches');
  const exportStatus = document.getElementById('export-status');
  let lastPalette = '';
  const valueOr = (data, field, fallback) => String(data.get(field) || '').trim() || fallback;
  const updateBrief = () => {
    const data = new FormData(briefForm);
    const paletteKey = data.get('palette');
    const palette = palettes[paletteKey] || palettes.harbor;
    if (paletteKey !== lastPalette) {
      swatches.replaceChildren(...palette.colors.map((color) => {
        const card = document.createElement('span');
        card.className = 'palette-swatch';
        const chip = document.createElement('span');
        chip.className = 'palette-chip';
        chip.style.backgroundColor = color;
        chip.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.textContent = color;
        card.append(chip, label);
        return card;
      }));
      lastPalette = paletteKey;
    }
    const reviewed = data.getAll('ready');
    const checklist = [...briefForm.querySelectorAll('[name="ready"]')].map((box) => `${box.checked ? '[x]' : '[ ]'} ${box.value}`).join('\n');
    output.textContent = [
      'COLOR IS AN AGREEMENT',
      'UES / private practice brief / original proposal',
      '',
      `PROJECT\n${valueOr(data, 'project', 'Project not yet named')}`,
      `SAMPLE ID + REVISION\n${valueOr(data, 'sample', 'ID and revision not yet specified')}`,
      `AUDIENCE\n${data.get('audience')}`,
      `MATERIAL + FINISH\n${data.get('material')}`,
      `PRODUCTION METHOD\n${data.get('process')}`,
      `ORIGINAL PALETTE\n${palette.name}: ${palette.colors.join(' · ')}\nOriginal sRGB screen approximations. Not Pantone matches, measured material colors or ink recipes.`,
      `REFERENCE + ROLE\n${valueOr(data, 'reference', 'Reference and intended role to be specified')}`,
      `VIEWING + PROOF PLAN\n${valueOr(data, 'viewing', 'Viewing conditions and proof plan to be specified')}`,
      `APPROVAL\n${valueOr(data, 'approval', 'Approval owner and acceptance decision to be specified')}`,
      `REFLECTION\n${valueOr(data, 'reflection', 'One observation and one uncertainty still to be recorded.')}`,
      `HANDOFF REVIEW (${reviewed.length}/6)\n${checklist}`,
      'Review checks are self-attested. They do not mean a physical sample has been approved.',
      'Independent educational practice; no enrollment, academic credit or certification. Draft remains private unless you choose to share it.',
      'Study: https://pointcast.xyz/ues/pantone/\nCore case study: https://pointcast.xyz/pantone/'
    ].join('\n\n');
    document.getElementById('brief-progress').textContent = `${reviewed.length} of 6 handoff checks reviewed`;
  };
  briefForm.addEventListener('input', () => { updateBrief(); exportStatus.textContent = ''; });
  briefForm.addEventListener('change', () => { updateBrief(); exportStatus.textContent = ''; });
  briefForm.addEventListener('submit', (event) => event.preventDefault());
  briefForm.addEventListener('reset', () => {
    setTimeout(() => { updateBrief(); exportStatus.textContent = 'The example brief has been restored. Your previous entries are no longer in this page.'; }, 0);
  });
  document.getElementById('download-brief').disabled = false;
  document.getElementById('download-brief').addEventListener('click', () => {
    updateBrief();
    const blob = new Blob([output.textContent + '\n'], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ues-color-handoff-brief.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    exportStatus.textContent = 'Download requested: ues-color-handoff-brief.txt. Check your browser downloads.';
  });
  document.getElementById('print-brief').disabled = false;
  document.getElementById('print-brief').addEventListener('click', () => {
    updateBrief();
    window.print();
    exportStatus.textContent = 'Print dialog requested. You can print or save the worksheet as a PDF.';
  });
  window.addEventListener('pageshow', updateBrief);
  updateBrief();
})();
