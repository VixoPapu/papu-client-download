const loginBtn = document.getElementById("loginBtn");
const loginAvatarEl = document.getElementById("loginAvatar");
const loginNameEl = document.getElementById("loginName");
const loginHintEl = document.getElementById("loginHint");
const loginStatusEl = document.getElementById("loginStatus");

function setStatus(text) {
  loginStatusEl.textContent = text;
}

function skinHeadUrl(uuid) {
  if (!uuid) return "../images/icons/grass_block.png";
  return `https://mc-heads.net/avatar/${uuid}/64`;
}

function setBusy(isBusy) {
  loginBtn.disabled = isBusy;
}

async function bootstrap() {
  const user = await window.papu.getUser();
  if (user) {
    loginNameEl.textContent = user.name;
    loginHintEl.textContent = "Sesion detectada. Abriendo launcher...";
    loginAvatarEl.src = skinHeadUrl(user.uuid);
    setStatus(`Sesion detectada: ${user.name}`);
    await window.papu.authComplete();
    return;
  }

  setStatus("Listo para iniciar sesion.");
}

loginBtn.addEventListener("click", async () => {
  setBusy(true);
  try {
    setStatus("Abriendo autenticacion de Microsoft...");
    const user = await window.papu.login();
    loginNameEl.textContent = user.name;
    loginHintEl.textContent = "Perfil cargado";
    loginAvatarEl.src = skinHeadUrl(user.uuid);
    setStatus(`Sesion iniciada: ${user.name}`);
    await window.papu.authComplete();
  } catch (error) {
    setStatus(`Error de login: ${error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
});

bootstrap().catch((error) => {
  setStatus(`Error al preparar login: ${error.message || String(error)}`);
});
