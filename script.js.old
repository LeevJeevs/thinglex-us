(() => {
    "use strict";

    const VIDEO_ID = "41htVtnDPxw";
    const AUDIO_LOAD_TIMEOUT_MS = 12000;
    const IS_HOSTED_PAGE = location.protocol === "http:" || location.protocol === "https:";

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

    function setGateState({ enabled = true, label, status }) {
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
        entered = true;

        if (gateButton) {
            gateButton.disabled = true;
        }

        // Playback starts here only when YouTube finished loading before the click.
        // Otherwise the site still opens and the sound button becomes usable later.
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

        if (!entered) {
            setGateState({
                enabled: true,
                label: "Tap to view",
                status: message || "Background audio is unavailable, but the page still works."
            });
        }
    }

    function createYouTubePlayer() {
        if (player || !window.YT || !window.YT.Player) return;

        const container = document.getElementById("bgAudio");
        if (!container) {
            markPlayerUnavailable("Background audio is unavailable, but the page still works.");
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
                        iframe.referrerPolicy = "origin";
                    } catch (_) {
                        // These attributes are optional enhancements.
                    }

                    event.target.setVolume(70);
                    event.target.mute();
                    updateSoundButton(true, true);

                    if (!entered) {
                        setGateState({
                            enabled: true,
                            label: "Tap to view",
                            status: "Background audio is ready."
                        });
                    }
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
                            "YouTube or the browser blocked the background audio. You can still enter."
                        );
                        return;
                    }

                    markPlayerUnavailable(
                        `Background audio failed to load (YouTube error ${event.data}). You can still enter.`
                    );
                }
            }
        });
    }

    function loadYouTubeAPI() {
        if (!IS_HOSTED_PAGE) {
            markPlayerUnavailable(
                "Background audio needs an http(s) page. The rest of the site still works locally."
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
            apiScript.referrerPolicy = "origin";
            apiScript.onerror = () => {
                markPlayerUnavailable("YouTube could not be reached. You can still enter.");
            };
            document.head.appendChild(apiScript);
        }

        audioLoadTimer = window.setTimeout(() => {
            if (!playerReady && !playerFailed) {
                markPlayerUnavailable("Background audio took too long to load. You can still enter.");
            }
        }, AUDIO_LOAD_TIMEOUT_MS);
    }

    profile?.setAttribute("aria-hidden", "true");
    setGateState({
        enabled: true,
        label: "Tap to view",
        status: "Loading background audio…"
    });

    gateButton?.addEventListener("click", (event) => {
        event.preventDefault();
        enter();
    });

    soundButton?.addEventListener("click", toggleSound);
    updateSoundButton(true, false);
    loadYouTubeAPI();
})();
