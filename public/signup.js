document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const statusMessage = document.getElementById("statusMessage");
  const submitButton = document.getElementById("submitButton");

  const fields = {
    name: document.getElementById("name"),
    dob: document.getElementById("dob"),
    gender: document.getElementById("gender"),
    contact: document.getElementById("contact"),
    current_country: document.getElementById("current_country"),
    current_city: document.getElementById("current_city"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirm_password: document.getElementById("confirm_password"),
  };

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\-\s()]{8,20}$/;

  function showStatus(message) {
    statusMessage.textContent = message;
    statusMessage.className =
      "mb-6 rounded-lg px-4 py-3 text-sm font-medium bg-red-50 text-red-700 border border-red-200";
  }

  function clearStatus() {
    statusMessage.textContent = "";
    statusMessage.className =
      "hidden mb-6 rounded-lg px-4 py-3 text-sm font-medium";
  }

  function getErrorElement(fieldName) {
    return document.querySelector(`[data-error-for="${fieldName}"]`);
  }

  function setFieldError(fieldName, message) {
    const field = fields[fieldName];
    const errorElement = getErrorElement(fieldName);

    if (!field || !errorElement) return;

    field.classList.remove("border-navy/15", "focus:ring-amber");
    field.classList.add("border-red-400", "focus:ring-red-400");

    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }

  function clearFieldError(fieldName) {
    const field = fields[fieldName];
    const errorElement = getErrorElement(fieldName);

    if (!field || !errorElement) return;

    field.classList.remove("border-red-400", "focus:ring-red-400");
    field.classList.add("border-navy/15", "focus:ring-amber");

    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }

  function clearAllErrors() {
    Object.keys(fields).forEach(clearFieldError);
    clearStatus();
  }

  function valueOf(fieldName) {
    return fields[fieldName].value.trim();
  }

  function validateSignupForm() {
    clearAllErrors();

    let isValid = true;

    const requiredFields = [
      "name",
      "dob",
      "gender",
      "contact",
      "current_country",
      "current_city",
      "email",
      "password",
      "confirm_password",
    ];

    requiredFields.forEach((fieldName) => {
      if (!valueOf(fieldName)) {
        setFieldError(fieldName, "This field is required.");
        isValid = false;
      }
    });

    if (valueOf("email") && !emailRegex.test(valueOf("email"))) {
      setFieldError("email", "Please enter a valid email address.");
      isValid = false;
    }

    if (valueOf("contact") && !phoneRegex.test(valueOf("contact"))) {
      setFieldError("contact", "Please enter a valid contact number.");
      isValid = false;
    }

    if (valueOf("password") && !passwordRegex.test(valueOf("password"))) {
      setFieldError(
        "password",
        "Password must have at least 8 characters, uppercase, lowercase, number, and special character."
      );
      isValid = false;
    }

    if (
      valueOf("password") &&
      valueOf("confirm_password") &&
      valueOf("password") !== valueOf("confirm_password")
    ) {
      setFieldError("confirm_password", "Passwords do not match.");
      isValid = false;
    }

    return isValid;
  }

  Object.keys(fields).forEach((fieldName) => {
    fields[fieldName].addEventListener("input", () => {
      clearFieldError(fieldName);
    });

    fields[fieldName].addEventListener("change", () => {
      clearFieldError(fieldName);
    });
  });

  form.addEventListener("submit", (event) => {
    if (!validateSignupForm()) {
      event.preventDefault();
      showStatus("Please fix the highlighted fields before creating your account.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating Account...";
  });
});