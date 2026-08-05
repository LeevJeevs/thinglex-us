(() => {
    "use strict";

    const VIDEO_ID = "41htVtnDPxw";
    const GATE_ENABLED = true;
    const AUDIO_LOAD_TIMEOUT_MS = 12000;
    const IS_WEB_PAGE = location.protocol === "http:" || location.protocol === "https:";

    const gate = document.getElementById("gate");
    const gateButton = document.getElementById("gateBtn");
    const gateButtonLabel = document.getElementById("gateBtnLabel");
    const gateAudioStatus = document.getElementById("gateAudioStatus");
    const soundButton = document.getElementById("soundToggle");
    const profile = document.getElementById("profile");

    let player = null;
    let playerReady = false;
    let playerFailed = false;
    let entered = false;
    let audioLoadTimer = null;

    function setGateState({ enabled, label, status }) {
        if (gateButton) {
            gateButton.disabled = !enabled;
        }

        if (gateButtonLabel && label) {
            gateButtonLabel.textContent = label;
        }

        if (gateAudioStatus && status) {
            gateAudioStatus.textContent = status;
        }
    }

    function updateSoundButton(isMuted, enabled = playerReady) {
        if (!soundButton) return;

        soundButton.disabled = !enabled;
        soundButton.classList.toggle("muted", isMuted);
        soundButton.setAttribute("aria-pressed", String(enabled && !isMuted));
        soundButton.setAttribute(
            "aria-label",
            !enabled
                ? "Background audio unavailable"
                : isMuted
                    ? "Unmute background audio"
                    : "Mute background audio"
        );
    }

    function startPlaybackFromGesture() {
        if (!playerReady || !player) return false;

        try {
            player.setVolume(70);
            player.unMute();
            player.playVideo();
            updateSoundButton(false, true);
            return true;
        } catch (error) {
            console.warn("Background audio could not be started.", error);
            updateSoundButton(true, true);
            return false;
        }
    }

    function revealProfile() {
        profile?.removeAttribute("aria-hidden");
        document.body.classList.add("entered");

        if (gate) {
            gate.setAttribute("aria-hidden", "true");
            gate.style.opacity = "0";
            gate.style.visibility = "hidden";
            gate.style.pointerEvents = "none";
        }

        window.setTimeout(() => {
            gate?.remove();

            if (profile) {
                try {
                    profile.focus({ preventScroll: true });
                } catch (_) {
                    profile.focus();
                }
            }
        }, 300);
    }

    function enter() {
        if (entered) return;

        if (!playerReady && !playerFailed) {
            setGateState({
                enabled: false,
                label: "Loading audio…",
                status: "The background audio is still preparing…"
            });
            return;
        }

        entered = true;
        if (gateButton) gateButton.disabled = true;

        if (playerReady) {
            startPlaybackFromGesture();
        }

        revealProfile();
    }

    function toggleSound() {
        if (!playerReady || !player) return;

        try {
            const isMuted = player.isMuted();
            const isPlaying = window.YT && player.getPlayerState() === YT.PlayerState.PLAYING;

            if (isMuted || !isPlaying) {
                player.setVolume(70);
                player.unMute();
                player.playVideo();
                updateSoundButton(false, true);
            } else {
                player.mute();
                updateSoundButton(true, true);
            }
        } catch (error) {
            console.warn("Background audio could not be toggled.", error);
        }
    }

    function markPlayerUnavailable(message) {
        playerFailed = true;
        playerReady = false;

        if (audioLoadTimer) {
            window.clearTimeout(audioLoadTimer);
            audioLoadTimer = null;
        }

        updateSoundButton(true, false);
        setGateState({
            enabled: true,
            label: "Tap to view",
            status: message || "Background audio could not load, but you can still enter."
        });
    }

    function createYouTubePlayer() {
        if (player || !window.YT || !window.YT.Player) return;

        const container = document.getElementById("bgAudio");
        if (!container) {
            markPlayerUnavailable("Background audio container is missing, but you can still enter.");
            return;
        }

        const pageUrl = location.href.split("#")[0];
        const playerVars = {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            loop: 1,
            playlist: VIDEO_ID,
            playsinline: 1,
            rel: 0,
            origin: location.origin,
            widget_referrer: pageUrl
        };

        player = new YT.Player("bgAudio", {
            width: "200",
            height: "200",
            videoId: VIDEO_ID,
            host: "https://www.youtube.com",
            playerVars,
            events: {
                onReady(event) {
                    playerReady = true;
                    playerFailed = false;

                    if (audioLoadTimer) {
                        window.clearTimeout(audioLoadTimer);
                        audioLoadTimer = null;
                    }

                    try {
                        const iframe = event.target.getIframe();
                        iframe.setAttribute("allow", "autoplay; encrypted-media");
                        iframe.setAttribute("title", "Background music player");
                        iframe.referrerPolicy = "strict-origin-when-cross-origin";
                    } catch (_) {
                        // Optional attributes only.
                    }

                    event.target.setVolume(70);
                    updateSoundButton(true, true);
                    setGateState({
                        enabled: true,
                        label: "Tap to view",
                        status: "Background audio is ready."
                    });
                },

                onStateChange(event) {
                    if (!window.YT) return;

                    if (event.data === YT.PlayerState.PLAYING) {
                        updateSoundButton(event.target.isMuted(), true);
                    } else if (event.data === YT.PlayerState.ENDED) {
                        event.target.seekTo(0, true);
                        event.target.playVideo();
                    }
                },

                onAutoplayBlocked() {
                    updateSoundButton(true, true);
                },

                onError(event) {
                    console.warn("YouTube background audio error:", event.data);

                    if (event.data === 153) {
                        markPlayerUnavailable(
                            "YouTube did not receive a website referrer. Open this through run-site.bat/run-site.sh or upload it to your web host."
                        );
                        return;
                    }

                    markPlayerUnavailable(`Background audio failed to load (YouTube error ${event.data}). You can still enter.`);
                }
            }
        });
    }

    function loadYouTubeAPI() {
        if (!IS_WEB_PAGE) {
            markPlayerUnavailable(
                "Local-file previews cannot identify the site to YouTube. Start run-site.bat/run-site.sh, then open the localhost address."
            );
            return;
        }

        if (window.YT && window.YT.Player) {
            createYouTubePlayer();
            return;
        }

        const previousReadyHandler = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            if (typeof previousReadyHandler === "function") {
                previousReadyHandler();
            }
            createYouTubePlayer();
        };

        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            const apiScript = document.createElement("script");
            apiScript.src = "https://www.youtube.com/iframe_api";
            apiScript.async = true;
            apiScript.referrerPolicy = "strict-origin-when-cross-origin";
            apiScript.onerror = () => {
                markPlayerUnavailable("YouTube could not be reached, but you can still enter.");
            };
            document.head.appendChild(apiScript);
        }

        audioLoadTimer = window.setTimeout(() => {
            if (!playerReady) {
                markPlayerUnavailable("Background audio took too long to load, but you can still enter.");
            }
        }, AUDIO_LOAD_TIMEOUT_MS);
    }

    if (GATE_ENABLED && gate) {
        profile?.setAttribute("aria-hidden", "true");
        setGateState({
            enabled: false,
            label: "Loading audio…",
            status: "Preparing background audio…"
        });

        gateButton?.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            enter();
        });
    } else {
        entered = true;
        document.body.classList.add("entered");
        gate?.remove();
    }

    soundButton?.addEventListener("click", toggleSound);
    updateSoundButton(true, false);
    loadYouTubeAPI();
})();
