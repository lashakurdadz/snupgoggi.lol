document.addEventListener('DOMContentLoaded', () => {
  const donateCheckbox = document.getElementById('donate');
  const donationInfo = document.getElementById('donation-info');
  const signupForm = document.getElementById('signup-form');
  const formStatus = document.getElementById('form-status');
  const accountNumberEl = document.getElementById('account-number');
  const copyBtn = document.getElementById('copy-account');
  const copyStatus = document.getElementById('copy-status');

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
      try {
        await navigator.clipboard.writeText(text);
        copyStatus.textContent = 'Account number copied. See you on the dance floor.';
      } catch (err) {
        copyStatus.textContent = 'Could not copy automatically, please copy it manually.';
      }
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

        signupForm.classList.add('submitted');
        nameInput.setAttribute('disabled', 'true');
        donateCheckbox.setAttribute('disabled', 'true');
      } catch (err) {
        formStatus.textContent = 'Network issue. Please try again in a moment.';
        formStatus.classList.add('error');
      }
    });
  }
});

