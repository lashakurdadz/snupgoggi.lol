document.addEventListener('DOMContentLoaded', () => {
  const SIGNUP_KEY = 'gogi_signed_up';

  const donateCheckbox = document.getElementById('donate');
  const donationInfo = document.getElementById('donation-info');
  const signupForm = document.getElementById('signup-form');
  const formStatus = document.getElementById('form-status');
  const accountNumberEl = document.getElementById('account-number');
  const copyBtn = document.getElementById('copy-account');
  const copyStatus = document.getElementById('copy-status');
  const nameField = document.querySelector('.field');
  const donateField = document.querySelector('.checkbox');
  const submitBtn = document.querySelector('.submit-btn');
  const cardFootnote = document.querySelector('.card-footnote');

  async function copyToClipboard(text) {
    const value = String(text || '').trim();
    if (!value) return false;

    // Modern clipboard API requires a secure context (https:// or localhost)
    try {
      if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_) {
      // fall through
    }

    // Fallback for older/mobile browsers
    try {
      const el = document.createElement('textarea');
      el.value = value;
      el.setAttribute('readonly', 'true');
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      el.setSelectionRange(0, el.value.length);
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(el);
      return Boolean(ok);
    } catch (_) {
      return false;
    }
  }

  function lockToConfirmation(guestName) {
    if (nameField) nameField.classList.add('hidden');
    if (donateField) donateField.classList.add('hidden');
    if (submitBtn) submitBtn.classList.add('hidden');
    if (cardFootnote) cardFootnote.classList.add('hidden');

    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.setAttribute('disabled', 'true');
    if (donateCheckbox) donateCheckbox.setAttribute('disabled', 'true');
    if (submitBtn) submitBtn.setAttribute('disabled', 'true');

    if (donationInfo) donationInfo.classList.remove('hidden');

    if (formStatus) {
      formStatus.textContent = `You're on the list, ${guestName}.`;
      formStatus.classList.remove('error');
      formStatus.classList.add('success');
    }
  }

  // If this browser already signed up, show confirmation-only state.
  try {
    const stored = localStorage.getItem(SIGNUP_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const storedName = parsed && typeof parsed.name === 'string' ? parsed.name : null;
      if (storedName) {
        lockToConfirmation(storedName);
        return;
      }
    }
  } catch (_) {
    // ignore corrupt storage
  }

  if (donateCheckbox && donationInfo) {
    donateCheckbox.addEventListener('change', () => {
      if (donateCheckbox.checked) {
        donationInfo.classList.remove('hidden');
      } else {
        donationInfo.classList.add('hidden');
      }
    });
  }

  if (copyBtn && accountNumberEl) {
    copyBtn.addEventListener('click', async () => {
      const text = accountNumberEl.textContent || '';
      copyStatus.textContent = '';
      const ok = await copyToClipboard(text);
      copyStatus.textContent = ok
        ? 'Account number copied. See you on the dance floor.'
        : 'Copy blocked. Tap and hold the account number to copy it manually.';
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      formStatus.textContent = '';
      formStatus.classList.remove('error', 'success');

      const nameInput = document.getElementById('name');
      const name = nameInput.value.trim();
      const willDonate = donateCheckbox.checked;

      if (!name) {
        formStatus.textContent = 'Please enter your name.';
        formStatus.classList.add('error');
        return;
      }

      if (!willDonate) {
        formStatus.textContent = 'You need to agree to donate to get on the list.';
        formStatus.classList.add('error');
        return;
      }

      try {
        const res = await fetch('/api/guests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, willDonate }),
        });

        const data = await res.json();

        if (!res.ok) {
          formStatus.textContent = data.error || 'Something went wrong. Try again.';
          formStatus.classList.add('error');
          return;
        }

        const msg = data.message || 'You are on the list!';
        formStatus.textContent = `${msg} ${name}, see you there.`;
        formStatus.classList.add('success');

        localStorage.setItem(
          SIGNUP_KEY,
          JSON.stringify({ name, willDonate: true, at: Date.now() })
        );

        lockToConfirmation(name);
      } catch (err) {
        formStatus.textContent = 'Network issue. Please try again in a moment.';
        formStatus.classList.add('error');
      }
    });
  }
});

