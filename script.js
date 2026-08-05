(() => {
    const VIDEO_ID = "41htVtnDPxw";
    const GATE_ENABLED = true;

    const gate = document.getElementById("gate");
    const gateButton = document.getElementById("gateBtn");
    const soundButton = document.getElementById("soundToggle");

    let player = null;
    let playerReady = false;
    let entered = false;
    let playWhenReady = false;

    function updateSoundButton(isMuted) {
        if (!soundButton) return;

        soundButton.classList.toggle("muted", isMuted);
        soundButton.setAttribute("aria-pressed", String(!isMuted));
        soundButton.setAttribute("aria-label", isMuted ? "Unmute background audio" : "Mute background audio");
    }

    function startFromUserGesture() {
        if (!playerReady || !player) return;

        player.unMute();
        player.playVideo();
        updateSoundButton(false);
    }
    
    function enter() {
        if (entered) return;

        entered = true;
        document.body.classList.add("entered");

        if (playerReady) {
            startFromUserGesture();
        } else {
            // content still opens if youtube hasnt finished loading + playback will begin muted when player becomes ready
            playWhenReady = true;
        }
    }

    function toggleSound() {
        if (!playerReady ||!player) return;

        if (player.isMuted()) {
            player.unMute();
            player.playVideo();
            updateSoundButton(false);
        } else {
            player.mute();
            updateSoundButton(true);
        }
    }

    window.onYouTubeIframeAPIReady = function () {
        const playerVars = {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            loop: 1,
            playlist: VIDEO_ID,
            playsinline: 1
        };

        if (location.protocol === "http:" || location.protocol === "https:") {
            playerVars.origin = location.origin;
        }

        player = new YT.Player("bgAudio", {
            width: "200",
            height: "200",
            videoId: VIDEO_ID,
            playerVars,
            events: {
                onReady(event) {
                    playerReady = true;

                    if (soundButton) {
                        soundButton.disabled = false;
                    }

                    if (playWhenReady || !GATE_ENABLED) {
                        event.target.mute();
                        event.target.playVideo();
                        updateSoundButton(true);
                    }
                },

                onAutoplayBlocked(event) {
                    event.target.mute();
                    updateSoundButton(true);
                }
            }
        });
    };

    if (GATE_ENABLED && gate) {
        gate.addEventListener("click", enter);

        gateButton?.addEventListener("click", (event) => {
            event.stopPropagation();
            enter();
        });
    } else {
        entered = true;
        playWhenReady = true;
        document.body.classList.add("entered");
    }

    soundButton?.addEventListener("click", toggleSound);
    updateSoundButton(true);
})();