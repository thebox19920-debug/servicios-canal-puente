(() => {
  const video = document.getElementById('scp-ad-video-player');
  const toggle = document.getElementById('scp-ad-voice-toggle');
  const status = document.getElementById('scp-ad-voice-state');
  if (!video || !toggle || !status) return;

  const speech = window.speechSynthesis;
  const scenes = [
    { start: 0, end: 5.2, text: '¿Buscas una solución y no sabes por dónde empezar? SCP te escucha.' },
    { start: 5.2, end: 10.4, text: 'Conectamos Usuarios Titulares con Usuarios Especialistas de distintos sectores.' },
    { start: 10.4, end: 15.6, text: 'Encuentra opciones de salud, trámites, vivienda, formación, bienestar y mucho más.' },
    { start: 15.6, end: 20.8, text: 'Te orientamos para elegir el servicio que mejor encaja contigo.' },
    { start: 20.8, end: 26, text: 'Te acompañamos con atención cercana, información clara y garantías.' },
    { start: 26, end: 31.3, text: 'Servicios Canal Puente. Cuéntanos qué necesitas y da el siguiente paso.' }
  ];

  let enabled = true;
  let spokenScene = -1;

  function sceneFor(time) {
    const found = scenes.findIndex((scene, index) => time >= scene.start && (time < scene.end || index === scenes.length - 1));
    return found < 0 ? scenes.length - 1 : found;
  }

  function spanishVoice() {
    if (!speech) return null;
    const voices = speech.getVoices();
    const spanish = voices.filter(voice => /^es([_-]|$)/i.test(voice.lang));
    return spanish.find(voice => /^es[-_]ES$/i.test(voice.lang)) || spanish[0] || null;
  }

  function speakScene() {
    if (!speech || !enabled || video.paused || video.ended) return;
    const index = sceneFor(video.currentTime);
    if (index === spokenScene) {
      if (speech.paused) speech.resume();
      return;
    }

    speech.cancel();
    spokenScene = index;
    const utterance = new SpeechSynthesisUtterance(scenes[index].text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = spanishVoice();
    if (voice) utterance.voice = voice;
    speech.speak(utterance);
  }

  if (!speech || typeof SpeechSynthesisUtterance === 'undefined') {
    toggle.disabled = true;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Locución no disponible';
    status.textContent = 'Este navegador no ofrece locución. Puedes leer el guion en la transcripción.';
    return;
  }

  toggle.setAttribute('aria-pressed', 'true');
  toggle.textContent = 'Locución activada';
  status.textContent = 'Al reproducir el vídeo, escucharás la locución en español disponible en tu dispositivo.';

  video.addEventListener('play', () => {
    if (speech.paused) speech.resume();
    status.textContent = enabled
      ? 'Locución activada. La voz se genera en este dispositivo.'
      : 'Locución desactivada. El vídeo continúa sin voz.';
    speakScene();
  });
  video.addEventListener('timeupdate', speakScene);
  video.addEventListener('pause', () => speech.pause());
  video.addEventListener('seeking', () => {
    speech.cancel();
    spokenScene = -1;
  });
  video.addEventListener('seeked', speakScene);
  video.addEventListener('ended', () => {
    speech.cancel();
    spokenScene = -1;
  });

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'Locución activada' : 'Locución desactivada';
    if (!enabled) {
      speech.cancel();
      spokenScene = -1;
      status.textContent = 'Locución desactivada. El vídeo continúa sin voz.';
    } else {
      status.textContent = 'Locución activada. La voz se genera en este dispositivo.';
      if (!video.paused) {
        spokenScene = -1;
        speakScene();
      }
    }
  });
})();
