document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("setupProfileForm");
  const statusMessage = document.getElementById("statusMessage");
  const submitButton = document.getElementById("submitButton");

  const avatarInput = document.getElementById("avatar");
  const aboutMeInput = document.getElementById("aboutMe");
  const preferredCurrencyInput = document.getElementById("preferredCurrency");
  const languageInput = document.getElementById("language");
  const avatarError = document.getElementById("err_avatar");

  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const maxImageSize = 2 * 1024 * 1024; // 2MB

  function showStatus(message) {
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.className =
      "mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600";
  }

  function clearStatus() {
    if (!statusMessage) return;

    statusMessage.textContent = "";
    statusMessage.className =
      "mb-4 hidden rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600";
  }

  function showAvatarError(message) {
    if (!avatarError || !avatarInput) return;

    avatarError.textContent = message;
    avatarError.style.display = "block";

    avatarInput.classList.add("invalid");
    avatarInput.classList.remove("valid");
  }

  function hideAvatarError() {
    if (!avatarError || !avatarInput) return;

    avatarError.textContent = "";
    avatarError.style.display = "none";

    avatarInput.classList.remove("invalid");
  }

  function validateAvatar() {
    if (!avatarInput) return true;

    const file = avatarInput.files[0];

    if (!file) {
      hideAvatarError();
      avatarInput.classList.remove("valid");
      return true;
    }

    if (!allowedImageTypes.includes(file.type)) {
      showAvatarError("Only JPG, PNG, and WEBP images are allowed.");
      return false;
    }

    if (file.size > maxImageSize) {
      showAvatarError("Image size must be 2MB or smaller.");
      return false;
    }

    hideAvatarError();
    avatarInput.classList.add("valid");
    return true;
  }

  function validateAboutMe() {
    if (!aboutMeInput) return true;

    const aboutMe = aboutMeInput.value.trim();

    if (aboutMe.length > 300) {
      showStatus("About Me must be 300 characters or fewer.");
      aboutMeInput.classList.add("invalid");
      aboutMeInput.classList.remove("valid");
      aboutMeInput.focus();
      return false;
    }

    aboutMeInput.classList.remove("invalid");

    if (aboutMe.length > 0) {
      aboutMeInput.classList.add("valid");
    } else {
      aboutMeInput.classList.remove("valid");
    }

    return true;
  }

  function validateSelect(input, message) {
    if (!input) return true;

    if (!input.value) {
      showStatus(message);
      input.classList.add("invalid");
      input.classList.remove("valid");
      input.focus();
      return false;
    }

    input.classList.remove("invalid");
    input.classList.add("valid");
    return true;
  }

  function validateSetupProfileForm() {
    clearStatus();

    if (!validateAvatar()) {
      showStatus("Please check your profile image and try again.");
      avatarInput.focus();
      return false;
    }

    if (!validateAboutMe()) {
      return false;
    }

    if (
      !validateSelect(
        preferredCurrencyInput,
        "Please select your preferred currency."
      )
    ) {
      return false;
    }

    if (!validateSelect(languageInput, "Please select your language.")) {
      return false;
    }

    return true;
  }

  if (avatarInput) {
    avatarInput.addEventListener("change", () => {
      clearStatus();
      validateAvatar();
    });
  }

  if (aboutMeInput) {
    aboutMeInput.addEventListener("input", () => {
      clearStatus();
      aboutMeInput.classList.remove("invalid");
    });
  }

  if (preferredCurrencyInput) {
    preferredCurrencyInput.addEventListener("change", () => {
      clearStatus();
      preferredCurrencyInput.classList.remove("invalid");
      preferredCurrencyInput.classList.add("valid");
    });
  }

  if (languageInput) {
    languageInput.addEventListener("change", () => {
      clearStatus();
      languageInput.classList.remove("invalid");
      languageInput.classList.add("valid");
    });
  }

  form.addEventListener("submit", (event) => {
    if (!validateSetupProfileForm()) {
      event.preventDefault();

      window.scrollTo({
        top: form.offsetTop - 24,
        behavior: "smooth",
      });

      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Saving Profile...";
  });
});