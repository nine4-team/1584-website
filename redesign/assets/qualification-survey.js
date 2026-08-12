(() => {
  const PRICING = {
    breakpointSqFt: 4500,
    rateBelowBreakpoint: 42,
    rateAtOrAboveBreakpoint: 38,
    sliderSpan: 200000,
    sliderStep: 5000
  };

  const SUBMISSION_ENDPOINT = '/api/qualification-survey';
  const form = document.querySelector('#qualification-form');
  if (!form) return;
  const surveyType = form.dataset.surveyType || 'second_home';
  const storagePrefix = surveyType === 'vacation_rental' ? 'vacationRentalQualification' : 'secondHomeQualification';

  const steps = [...form.querySelectorAll('.survey-step')];
  const standardFlow = ['intro', 'contact', 'ownership', 'scope', 'priorities', 'squareFootage', 'investment', 'involvement'];
  const progressLabel = document.querySelector('#progress-label');
  const progressBar = document.querySelector('#progress-bar');
  const rankingButtons = [...document.querySelectorAll('[data-priority]')];
  const priorityOrder = document.querySelector('#priority-order');
  const rankPrompt = document.querySelector('#rank-prompt');
  const resetRanking = document.querySelector('#reset-ranking');
  const investmentSlider = document.querySelector('#investment-upper');
  const investmentDisplay = document.querySelector('#investment-display');
  const investmentMinLabel = document.querySelector('#investment-min-label');
  const investmentMaxLabel = document.querySelector('#investment-max-label');
  const belowMinimumCopy = document.querySelector('#below-minimum-copy');
  const calculationSqFt = document.querySelector('#calculation-square-feet');
  const minimumInvestment = document.querySelector('#minimum-investment');
  const appliedRate = document.querySelector('#applied-rate');
  const investmentAnswer = document.querySelector('#investment-answer');
  let currentStep = 'intro';
  let rankings = [];
  let remoteRecord = JSON.parse(sessionStorage.getItem(`${storagePrefix}Record`) || 'null');

  const money = value => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(value);

  function showStep(stepName) {
    currentStep = stepName;
    steps.forEach(step => {
      const active = step.dataset.step === stepName;
      step.classList.toggle('is-active', active);
      step.toggleAttribute('inert', !active);
      step.setAttribute('aria-hidden', String(!active));
    });

    const flowIndex = standardFlow.indexOf(stepName);
    const isResult = stepName.startsWith('disqualified') || stepName === 'qualified';
    if (isResult) {
      progressLabel.textContent = 'Assessment complete';
      progressBar.style.width = '100%';
    } else {
      const completed = Math.max(0, flowIndex);
      progressLabel.textContent = flowIndex === 0 ? 'A quick fit assessment' : `Step ${flowIndex} of ${standardFlow.length - 1}`;
      progressBar.style.width = `${(completed / (standardFlow.length - 1)) * 100}%`;
    }

    const heading = steps.find(step => step.dataset.step === stepName)?.querySelector('h1, h2, legend');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (heading) window.setTimeout(() => heading.focus?.({ preventScroll: true }), 50);
  }

  function selected(name) {
    return form.querySelector(`[name="${name}"]:checked`);
  }

  function errorFor(stepName, message = '') {
    const error = form.querySelector(`[data-step="${stepName}"] .field-error`);
    if (error) error.textContent = message;
  }

  function validateStep(stepName) {
    errorFor(stepName);
    if (stepName === 'ownership' && !selected('ownership')) return errorFor(stepName, 'Please choose the option that best describes your plans.'), false;
    if (stepName === 'scope' && !selected('scope')) return errorFor(stepName, 'Please choose the scope closest to what you have in mind.'), false;
    if (stepName === 'priorities' && rankings.length !== 3) return errorFor(stepName, 'Please rank all three project priorities.'), false;
    if (stepName === 'squareFootage' && !selected('square_footage')) return errorFor(stepName, 'Please choose the closest square-footage range.'), false;
    if (stepName === 'investment' && !selected('investment_type')) return errorFor(stepName, 'Please choose the investment response that fits best.'), false;
    if (stepName === 'involvement' && !selected('involvement')) return errorFor(stepName, 'Please choose the working style that sounds most like you.'), false;
    return true;
  }

  function contactIsValid() {
    errorFor('contact');
    const contactStep = form.querySelector('[data-step="contact"]');
    const invalid = [...contactStep.querySelectorAll('input[required]')].find(input => !input.checkValidity());
    if (!invalid) return true;
    errorFor('contact', invalid.validity.typeMismatch ? 'Please enter a valid email address.' : 'Please complete each contact field.');
    invalid.focus();
    return false;
  }

  function surveyPayload(status, lastCompletedStep) {
    const values = Object.fromEntries(new FormData(form).entries());
    delete values.company_website;
    return {
      surveyType,
      action: remoteRecord?.contactId ? 'progress' : 'identify',
      contactId: remoteRecord?.contactId || '',
      noteId: remoteRecord?.noteId || '',
      sessionId: remoteRecord?.sessionId || crypto.randomUUID(),
      status,
      lastCompletedStep,
      answers: values
    };
  }

  async function saveProgress(status = 'in_progress', lastCompletedStep = currentStep, requireRemote = false) {
    const payload = surveyPayload(status, lastCompletedStep);
    sessionStorage.setItem(`${storagePrefix}Partial`, JSON.stringify(payload));

    if (location.protocol === 'file:') {
      remoteRecord = { ...(remoteRecord || {}), sessionId: payload.sessionId, lastCompletedStep };
      sessionStorage.setItem(`${storagePrefix}Record`, JSON.stringify(remoteRecord));
      return true;
    }

    try {
      const response = await fetch(SUBMISSION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!response.ok) throw new Error('Save failed');
      const result = await response.json();
      remoteRecord = { contactId: result.contactId, noteId: result.noteId, sessionId: payload.sessionId, lastCompletedStep };
      sessionStorage.setItem(`${storagePrefix}Record`, JSON.stringify(remoteRecord));
      return true;
    } catch (error) {
      return !requireRemote;
    }
  }

  function configureInvestment() {
    const squareFootageChoice = selected('square_footage');
    if (!squareFootageChoice) return;
    const squareFeet = Number(squareFootageChoice.dataset.calculationSqft);
    const rate = squareFeet < PRICING.breakpointSqFt ? PRICING.rateBelowBreakpoint : PRICING.rateAtOrAboveBreakpoint;
    const rawMinimum = squareFeet * rate;
    const minimum = Math.ceil(rawMinimum / PRICING.sliderStep) * PRICING.sliderStep;
    const maximum = minimum + PRICING.sliderSpan;
    const midpoint = minimum + (PRICING.sliderSpan / 2);

    investmentSlider.min = String(minimum);
    investmentSlider.max = String(maximum);
    investmentSlider.step = String(PRICING.sliderStep);
    investmentSlider.value = String(midpoint);
    calculationSqFt.value = String(squareFeet);
    minimumInvestment.value = String(minimum);
    appliedRate.value = String(rate);
    investmentMinLabel.textContent = `${money(minimum)} minimum`;
    investmentMaxLabel.textContent = money(maximum);
    belowMinimumCopy.textContent = `My maximum budget is less than ${money(minimum)}`;
    updateInvestmentDisplay();
  }

  function updateInvestmentDisplay() {
    const minimum = Number(investmentSlider.min || minimumInvestment.value || 0);
    const upper = Number(investmentSlider.value || 0);
    investmentDisplay.textContent = upper === minimum ? `About ${money(minimum)}` : `${money(minimum)}–${money(upper)}`;
    if (selected('investment_type')?.value === 'range') investmentAnswer.value = investmentDisplay.textContent;
  }

  async function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep === 'intro') return showStep('contact');
    if (currentStep === 'ownership' && selected('ownership').value === 'none') {
      await saveProgress('disqualified_ownership', 'ownership');
      return showStep('disqualified-ownership');
    }
    if (currentStep === 'scope' && !['entire', 'most'].includes(selected('scope').value)) {
      await saveProgress('disqualified_scope', 'scope');
      return showStep('disqualified-scope');
    }
    if (currentStep === 'squareFootage') configureInvestment();
    if (currentStep === 'investment' && selected('investment_type').value === 'below') {
      await saveProgress('disqualified_budget', 'investment');
      return showStep('disqualified-budget');
    }
    if (currentStep === 'involvement' && !['fully_delegated', 'designer_led'].includes(selected('involvement').value)) {
      await saveProgress('disqualified_involvement', 'involvement');
      return showStep('disqualified-involvement');
    }
    if (currentStep === 'involvement') {
      await saveProgress('qualified', 'involvement');
      return showStep('qualified');
    }
    await saveProgress('in_progress', currentStep);
    const index = standardFlow.indexOf(currentStep);
    if (index >= 0 && index < standardFlow.length - 1) showStep(standardFlow[index + 1]);
  }

  function backStep() {
    const index = standardFlow.indexOf(currentStep);
    if (index > 0) showStep(standardFlow[index - 1]);
  }

  function updateRanking() {
    rankingButtons.forEach(button => {
      const rank = rankings.indexOf(button.dataset.priority);
      button.classList.toggle('is-ranked', rank !== -1);
      button.querySelector('.rank-number').textContent = rank === -1 ? '' : String(rank + 1);
      button.setAttribute('aria-label', `${button.dataset.priority}, ${rank === -1 ? 'not ranked' : `ranked ${rank + 1}`}`);
    });
    priorityOrder.value = rankings.join(',');
    rankPrompt.textContent = rankings.length === 0 ? 'Choose your first priority' : rankings.length === 1 ? 'Now choose your second priority' : rankings.length === 2 ? 'Choose your final priority' : 'Your priorities are ranked';
    resetRanking.hidden = rankings.length === 0;
    errorFor('priorities');
  }

  rankingButtons.forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.priority;
    if (rankings.includes(value)) rankings = rankings.filter(item => item !== value);
    else if (rankings.length < 3) rankings.push(value);
    updateRanking();
  }));

  resetRanking.addEventListener('click', () => { rankings = []; updateRanking(); });
  investmentSlider.addEventListener('input', () => {
    const rangeOption = form.querySelector('[name="investment_type"][value="range"]');
    rangeOption.checked = true;
    updateInvestmentDisplay();
  });

  form.addEventListener('change', event => {
    const step = event.target.closest('.survey-step');
    if (step) errorFor(step.dataset.step);
    if (event.target.name === 'investment_type') {
      investmentSlider.disabled = event.target.value !== 'range';
      investmentAnswer.value = event.target.value === 'range'
        ? investmentDisplay.textContent
        : event.target.closest('.choice-card').innerText.trim();
    }
  });

  form.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', nextStep));
  form.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', backStep));
  form.querySelector('[data-contact-next]').addEventListener('click', async event => {
    if (!contactIsValid()) return;
    if (form.elements.company_website.value) return;
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Saving…';
    const saved = await saveProgress('started', 'contact', true);
    button.disabled = false;
    button.textContent = 'Continue';
    if (!saved) {
      errorFor('contact', 'We could not save your information. Please check your connection and try again.');
      return;
    }
    showStep('ownership');
  });

  form.addEventListener('submit', event => event.preventDefault());

  window.addEventListener('pagehide', () => {
    if (location.protocol === 'file:' || !remoteRecord?.contactId || currentStep === 'qualified' || currentStep.startsWith('disqualified')) return;
    const payload = surveyPayload('abandoned', remoteRecord.lastCompletedStep || 'contact');
    navigator.sendBeacon(SUBMISSION_ENDPOINT, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  });

  updateRanking();
  showStep('intro');
})();
