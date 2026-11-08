
document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("audio-player");
  const playBtn = document.getElementById("play-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  const fileInput = document.getElementById("file-input");
  const onlineUrl = document.getElementById("online-url");
  const addOnline = document.getElementById("add-online");

  const playlistUI = document.getElementById("playlist");
  const embedPlayer = document.getElementById("embed-player");
  const directControls = document.getElementById("direct-controls");

  const seekBar = document.getElementById("seek-bar");
  const volumeBar = document.getElementById("volume-bar");

  const title = document.getElementById("song-title");
  const source = document.getElementById("song-source");
  const status = document.getElementById("music-status");

  const currentTime = document.getElementById("current-time");
  const duration = document.getElementById("duration");
  const songCount = document.getElementById("song-count");

  let songs = [];
  let currentIndex = -1;

  audio.volume = 0.7;

  // ĐỊNH DẠNG THỜI GIAN
  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);

    return min + ":" + String(sec).padStart(2, "0");
  }

  // NHẬN DIỆN LINK NHẠC
  function identifyMusic(raw) {
    let url;

    try {
      url = new URL(raw);

      if (!["https:", "http:"].includes(url.protocol)) {
        return null;
      }
    } catch {
      return null;
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname;

    // SPOTIFY
    if (host === "open.spotify.com") {

      const parts = path.split("/").filter(Boolean);

      const types = [
        "track", "album", "playlist", "episode", "show"
      ];

      const typeIndex = parts.findIndex(part =>
        types.includes(part)
      );

      if (typeIndex !== -1) {
        const type = parts[typeIndex];
        const id = parts[typeIndex + 1];

        if (id && /^[a-zA-Z0-9]+$/.test(id)) {
          return {
            type: "embed",
            platform: "Spotify",
            name: "Spotify " + type,
            embed:
              "https://open.spotify.com/embed/" +
              type + "/" + id,
            height: type === "track" ? 152 : 352
          };
        }
      }

      return null;
    }

    // YOUTUBE VÀ YOUTUBE MUSIC
    if (
      host === "youtube.com" ||
      host === "music.youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be"
    ) {

      let videoId = "";

      const playlistId = url.searchParams.get("list");

      if (host === "youtu.be") {
        videoId = path.split("/").filter(Boolean)[0] || "";
      } else {
        videoId = url.searchParams.get("v") || "";

        if (!videoId) {
          const parts = path.split("/").filter(Boolean);

          if (
            ["shorts", "live", "embed"].includes(parts[0])
          ) {
            videoId = parts[1] || "";
          }
        }
      }

      let embed = "";

      if (/^[\w-]{11}$/.test(videoId)) {
        embed =
          "https://www.youtube.com/embed/" + videoId;

        if (playlistId && /^[\w-]+$/.test(playlistId)) {
          embed += "?list=" + encodeURIComponent(playlistId);
        }

      } else if (
        playlistId &&
        /^[\w-]+$/.test(playlistId)
      ) {
        embed =
          "https://www.youtube.com/embed/videoseries?list=" +
          encodeURIComponent(playlistId);
      }

      if (embed) {
        return {
          type: "embed",
          platform:
            host === "music.youtube.com"
              ? "YouTube Music"
              : "YouTube",
          name: "YouTube Music",
          embed: embed,
          height: 250
        };
      }

      return null;
    }

    // SOUNDCLOUD
    if (
      host === "soundcloud.com" ||
      host === "m.soundcloud.com"
    ) {

      return {
        type: "embed",
        platform: "SoundCloud",
        name: "SoundCloud Music",
        embed:
          "https://w.soundcloud.com/player/?url=" +
          encodeURIComponent(url.href) +
          "&auto_play=false&visual=true",
        height: 300
      };
    }

    // LINK AUDIO TRỰC TIẾP
    if (
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(path)
    ) {
      return {
        type: "audio",
        platform: "Direct Audio",
        name: decodeURIComponent(
          path.split("/").pop()
        ).replace(/\.[^/.]+$/, ""),
        url: url.href
      };
    }

    return null;
  }

  // HIỂN THỊ PLAYLIST
  function renderPlaylist() {

    playlistUI.innerHTML = "";

    songCount.textContent = songs.length + " bài hát";

    songs.forEach((song, index) => {

      const li = document.createElement("li");

      li.className =
        index === currentIndex ? "active" : "";

      const info = document.createElement("div");
      info.className = "playlist-info";

      const name = document.createElement("strong");
      name.textContent = song.name;

      const platform = document.createElement("small");
      platform.textContent = song.platform;

      info.appendChild(name);
      info.appendChild(platform);

      const remove = document.createElement("button");
      remove.textContent = "×";
      remove.className = "remove-song";
      remove.title = "Xóa bài hát";

      info.addEventListener("click", () => {
        loadSong(index, song.type === "audio");
      });

      remove.addEventListener("click", event => {
        event.stopPropagation();
        removeSong(index);
      });

      li.appendChild(info);
      li.appendChild(remove);

      playlistUI.appendChild(li);
    });
  }

  // THÊM BÀI HÁT
  function addSong(song) {

    if (!song) {
      status.textContent = "Không nhận diện được link nhạc!";
      return;
    }

    songs.push(song);

    renderPlaylist();

    if (currentIndex === -1) {
      loadSong(0, false);
    }

    status.textContent =
      "Đã thêm vào playlist: " + song.platform;
  }

  // TẢI BÀI HÁT
  function loadSong(index, autoplay = false) {

    if (index < 0 || index >= songs.length) return;

    currentIndex = index;

    const song = songs[index];

    title.textContent = song.name;
    source.textContent = song.platform;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    embedPlayer.innerHTML = "";

    playBtn.textContent = "▶";

    seekBar.value = 0;
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";

    if (song.type === "audio") {

      directControls.style.display = "block";
      audio.style.display = "block";

      audio.src = song.url;
      audio.load();

      status.textContent = "Sẵn sàng phát nhạc trực tiếp";

      if (autoplay) {
        playSong();
      }

    } else {

      directControls.style.display = "none";
      audio.style.display = "none";

      const iframe = document.createElement("iframe");

      iframe.src = song.embed;
      iframe.width = "100%";
      iframe.height = song.height;

      iframe.allow =
        "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";

      iframe.allowFullscreen = true;
      iframe.loading = "lazy";

      iframe.referrerPolicy =
        "strict-origin-when-cross-origin";

      embedPlayer.appendChild(iframe);

      status.textContent =
        "Trình phát nhúng: " + song.platform;
    }

    renderPlaylist();
  }

  // PHÁT NHẠC TRỰC TIẾP
  async function playSong() {

    if (currentIndex === -1 && songs.length > 0) {
      loadSong(0);
    }

    if (currentIndex === -1) return;

    if (songs[currentIndex].type !== "audio") {
      status.textContent =
        "Hãy sử dụng nút phát trên trình phát của nền tảng.";
      return;
    }

    try {

      await audio.play();

      playBtn.textContent = "Ⅱ";

      if ("mediaSession" in navigator &&
          "MediaMetadata" in window) {

        navigator.mediaSession.metadata =
          new MediaMetadata({
            title: songs[currentIndex].name,
            artist: "ARIZUTENKASAWA",
            album: "ARIZU MUSIC"
          });

        navigator.mediaSession.setActionHandler(
          "play", playSong
        );

        navigator.mediaSession.setActionHandler(
          "pause", () => audio.pause()
        );

        navigator.mediaSession.setActionHandler(
          "previoustrack", previousSong
        );

        navigator.mediaSession.setActionHandler(
          "nexttrack", nextSong
        );
      }

    } catch (error) {
      status.textContent = "Không thể phát bài hát!";
    }
  }

  // CHUYỂN BÀI
  function nextSong() {

    if (songs.length === 0) return;

    const next =
      (currentIndex + 1) % songs.length;

    loadSong(next, songs[next].type === "audio");
  }

  function previousSong() {

    if (songs.length === 0) return;

    const previous =
      (currentIndex - 1 + songs.length) % songs.length;

    loadSong(previous, songs[previous].type === "audio");
  }

  // XÓA BÀI HÁT
  function removeSong(index) {

    const wasCurrent = index === currentIndex;

    if (songs[index].objectUrl) {
      URL.revokeObjectURL(songs[index].objectUrl);
    }

    songs.splice(index, 1);

    if (songs.length === 0) {

      currentIndex = -1;

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      embedPlayer.innerHTML = "";

      title.textContent = "Chưa chọn bài hát";
      source.textContent = "ARIZU MUSIC PLAYER";

      directControls.style.display = "block";

    } else if (wasCurrent) {

      currentIndex = -1;
      loadSong(Math.min(index, songs.length - 1));

    } else if (index < currentIndex) {

      currentIndex--;
    }

    renderPlaylist();
  }

  // NÚT ĐIỀU KHIỂN
  playBtn.addEventListener("click", () => {

    if (currentIndex === -1) {
      if (songs.length > 0) loadSong(0, true);
      return;
    }

    if (songs[currentIndex].type !== "audio") {
      status.textContent =
        "Điều khiển bài này trực tiếp trong trình phát nhúng.";
      return;
    }

    if (audio.paused) {
      playSong();
    } else {
      audio.pause();
    }
  });

  prevBtn.addEventListener("click", previousSong);
  nextBtn.addEventListener("click", nextSong);

  // CHỌN NHẠC TỪ ĐIỆN THOẠI
  fileInput.addEventListener("change", event => {

    const files = Array.from(event.target.files || []);

    files.forEach(file => {

      if (!file.type.startsWith("audio/")) return;

      const objectUrl = URL.createObjectURL(file);

      addSong({
        type: "audio",
        name: file.name.replace(/\.[^/.]+$/, ""),
        platform: "Nhạc từ điện thoại",
        url: objectUrl,
        objectUrl: objectUrl
      });
    });

    fileInput.value = "";
  });

  // THÊM LINK NHẠC
  addOnline.addEventListener("click", () => {

    const raw = onlineUrl.value.trim();

    if (!raw) {
      status.textContent = "Hãy nhập link nhạc!";
      return;
    }

    const song = identifyMusic(raw);

    if (!song) {
      status.textContent =
        "Link không hợp lệ hoặc chưa được hỗ trợ!";
      return;
    }

    addSong(song);
    onlineUrl.value = "";
  });

  onlineUrl.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      addOnline.click();
    }
  });

  // THANH TIẾN TRÌNH
  audio.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {

    currentTime.textContent =
      formatTime(audio.currentTime);

    if (Number.isFinite(audio.duration) &&
        audio.duration > 0) {

      seekBar.value =
        (audio.currentTime / audio.duration) * 100;
    }
  });

  seekBar.addEventListener("input", () => {

    if (Number.isFinite(audio.duration)) {

      audio.currentTime =
        (seekBar.value / 100) * audio.duration;
    }
  });

  volumeBar.addEventListener("input", () => {
    audio.volume = Number(volumeBar.value);
  });

  audio.addEventListener("play", () => {
    playBtn.textContent = "Ⅱ";
  });

  audio.addEventListener("pause", () => {
    playBtn.textContent = "▶";
  });

  audio.addEventListener("ended", nextSong);

  audio.addEventListener("error", () => {
    if (currentIndex !== -1 &&
        songs[currentIndex].type === "audio") {
      status.textContent =
        "Không tải được file nhạc. Hãy kiểm tra link!";
    }
  });

  // HIỆU ỨNG CUỘN TRANG
  const sections = document.querySelectorAll("section");

  const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });

  }, { threshold: 0.15 });

  sections.forEach(section => observer.observe(section));

  // NĂM HIỆN TẠI
  const footer = document.querySelector("footer");

  if (footer) {
    footer.textContent =
      `© ${new Date().getFullYear()} ARIZU. All rights reserved.`;
  }

});

// ARIZU SNOW ANIMATION

const snowContainer =
  document.getElementById("snow-container");

if (snowContainer) {
  for (let i = 0; i < 45; i++) {
    const snow = document.createElement("span");

    snow.className = "snow";
    snow.textContent = "❄";

    snow.style.left = Math.random() * 100 + "%";
    snow.style.fontSize =
      (Math.random() * 12 + 7) + "px";

    snow.style.animationDuration =
      (Math.random() * 10 + 7) + "s";

    snow.style.animationDelay =
      (Math.random() * -15) + "s";

    snowContainer.appendChild(snow);
  }
}

