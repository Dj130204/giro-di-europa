document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("members-form");
  const submitBtn = document.getElementById("submitBtn");
  const status = document.getElementById("formStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Submitting...";
    submitBtn.disabled = true;

    const payload = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      carMake: form.carMake.value.trim(),
      carModel: form.carModel.value.trim(),
      liveryPack: form.liveryPack.checked
    };

    try {
      const res = await fetch("/members/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        status.className = "success";
        status.textContent = "Thanks! Check your email for a confirmation link.";
        form.reset();
      } else {
        status.className = "error";
        status.textContent = data.error || "Something went wrong.";
      }
    } catch (err) {
      status.className = "error";
      status.textContent = "Network error. Please try again.";
    } finally {
      submitBtn.disabled = false;
    }
  });
});
