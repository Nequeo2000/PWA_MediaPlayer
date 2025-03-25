function setMediaSession() {
    let title = (fileList.length != 0) ? fileList[currentPlayingIndex].name : "";

    // test for media session api
    if (!("mediaSession" in navigator))
        return;

    if (navigator.mediaSession.metadata) {
        // set titel of mediaSession
        navigator.mediaSession.metadata.title = title;

        return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: "PWA MediaPlayer",
        album: " ",
        artwork: [
            {
                src: defaultCoverImagePath,
                sizes: "100x100",
                type: "image/png",
            }
        ],
    });

    navigator.mediaSession.playAction = () => {
        player.play()
            .then(() => {
                setMediaSession();
            });
        navigator.mediaSession.playbackState = "playing";
    };
    navigator.mediaSession.setActionHandler("play", navigator.mediaSession.playAction);

    navigator.mediaSession.setActionHandler("pause", () => {
        player.pause();
        navigator.mediaSession.playbackState = "paused";
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.fastSeek && 'fastSeek' in player) {
            player.fastSeek(details.seekTime);
            return;
        }
        player.currentTime = details.seekTime;
    });

    navigator.mediaSession.previousTrackAction = () => {
        playIndex( (fileList.length + currentPlayingIndex - 1) % fileList.length );
    };
    navigator.mediaSession.setActionHandler("previoustrack", navigator.mediaSession.previousTrackAction);

    navigator.mediaSession.nextTrackAction = () => {
        playIndex( (fileList.length + currentPlayingIndex + 1) % fileList.length );
    };
    navigator.mediaSession.setActionHandler("nexttrack", navigator.mediaSession.nextTrackAction);
}