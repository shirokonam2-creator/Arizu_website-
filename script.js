document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const audio = $("audio-player");
  const video = $("video-player");
  const videoContainer = $("video-container");
  const cover = $("cover-image");
  const title = $("song-title");
  const source = $("song-source");
  const status = $("music-status");
  const playlistUI = $("playlist");
  const songCount = $("song-count");
  const fileInput = $("file-input");
  const onlineUrl = $("online-url");
  const addOnline = $("add-online");
  const embedPlayer = $("embed-player");
  const directControls = $("direct-controls");
  const playBtn = $("play-btn");
  const prevBtn = $("prev-btn");
  const nextBtn = $("next-btn");
  const rewindBtn = $("rewind-btn");
  const forwardBtn = $("forward-btn");
  const repeatBtn = $("repeat-btn");
  const shuffleBtn = $("shuffle-btn");
  const seekBar = $("seek-bar");
  const volumeBar = $("volume-bar");
  const currentTimeEl = $("current-time");
  const durationEl = $("duration");

const speedDown = $("speed-down");
  const speedUp = $("speed-up");
  const speedValue = $("speed-value");

  const speedLevels = [0.5, 1, 1.5, 2];
  let speedIndex = 1;
  let playbackSpeed = 1;
  
  const DEFAULT_COVER = "arizu.jpg";
  // =================================
 // ARIZU TWO PLAYLISTS
 // =================================

// DANH SÁCH PHÁT MẶC ĐỊNH
const defaultSongs = [
 {
    type: "audio",
    name: "love for you",
    platform: "ARIZU MUSIC",
    url: "arizu/music/love_for_you.mp3",
    cover: "arizu/music/ariop.jpg"
 },
 {
    type: "audio",
    name: "Chạnh lòng thương cô 2",
    platform: "ARIZU MUSIC",
    url: "arizu/music/ari.mp3",
    cover: "arizu/music/arizu1.jpg"
  },
  {
    type: "audio",
    name: "Chạnh lòng thương cô 2 remix",
    platform: "ARIZU MUSIC",
    url: "arizu/music/song2.mp3",
    cover: "arizu/music/arizu1.jpg"
  }
];

// DANH SÁCH PHÁT CỦA NGƯỜI DÙNG
let customSongs = [];

try {
  customSongs = JSON.parse(
    localStorage.getItem("arizu_custom_songs") || "[]"
  );
} catch (error) {
  customSongs = [];
}

// PLAYLIST ĐANG CHỌN
let activePlaylist = "default";

let songs = defaultSongs;
  let currentIndex = -1;
  const defaultTab = $("default-tab");
const customTab = $("custom-tab");
const playlistTitle = $("playlist-title");

function saveCustomSongs() {
  const data = customSongs
    .filter(song => !song.objectUrl)
    .map(song => ({
      type: song.type,
      name: song.name,
      platform: song.platform,
      url: song.url,
      embed: song.embed,
      cover: song.cover,
      height: song.height
    }));

  localStorage.setItem(
    "arizu_custom_songs",
    JSON.stringify(data)
  );
}

function switchPlaylist(type) {
  // Dừng bài đang phát
  clearPlayers();

  activePlaylist = type;

  if (type === "default") {
    songs = defaultSongs;
    defaultTab.classList.add("active");
    customTab.classList.remove("active");
    playlistTitle.textContent = "Danh sách phát mặc định";
  } else {
    songs = customSongs;
    customTab.classList.add("active");
    defaultTab.classList.remove("active");
    playlistTitle.textContent = "Danh sách phát của tôi";
  }

  currentIndex = -1;

  if (songs.length > 0) {
    loadSong(0, false);
  } else {
    title.textContent = "Chưa có bài hát";
    source.textContent = "ARIZU MUSIC PLAYER";
    cover.src = DEFAULT_COVER;
  }

  renderPlaylist();

  setStatus(
    type === "default"
      ? "Đang xem nhạc mặc định."
      : "Đang xem nhạc của bạn."
  );
}

defaultTab.addEventListener("click", () => {
  switchPlaylist("default");
});

customTab.addEventListener("click", () => {
  switchPlaylist("custom");
});
  let activeMedia = null;
  let repeatMode = 0; // 0: off, 1: playlist, 2: one
  let shuffle = false;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  function setStatus(message) {
    status.textContent = message;
  }

// =================================
  // ARIZU PLAYBACK SPEED
  // =================================

  function updatePlaybackSpeed() {
    playbackSpeed = speedLevels[speedIndex];

    if (audio) audio.playbackRate = playbackSpeed;
    if (video) video.playbackRate = playbackSpeed;
    if (activeMedia) activeMedia.playbackRate = playbackSpeed;

    if (speedValue) speedValue.textContent = playbackSpeed + "x";
    if (speedDown) speedDown.disabled = speedIndex === 0;
    if (speedUp) speedUp.disabled = speedIndex === speedLevels.length - 1;

    setStatus("⚡ Tốc độ phát: x" + playbackSpeed);
  }

  if (speedDown) {
    speedDown.addEventListener("click", () => {
      if (speedIndex > 0) {
        speedIndex--;
        updatePlaybackSpeed();
      }
    });
  }

  if (speedUp) {
    speedUp.addEventListener("click", () => {
      if (speedIndex < speedLevels.length - 1) {
        speedIndex++;
        updatePlaybackSpeed();
      }
    });
  }

  if (speedValue) {
    speedValue.textContent = playbackSpeed + "x";
  }

  function updateRepeatButton() {
    repeatBtn.textContent = repeatMode === 2 ? "🔂" : "🔁";
    repeatBtn.title = [
      "Lặp lại: Tắt",
      "Lặp lại: Toàn bộ playlist",
      "Lặp lại: Một video/bài"
    ][repeatMode];
    repeatBtn.classList.toggle("active", repeatMode !== 0);
    repeatBtn.style.opacity = repeatMode === 0 ? "0.55" : "1";
  }

  function updateShuffleButton() {
    shuffleBtn.classList.toggle("active", shuffle);
    shuffleBtn.style.opacity = shuffle ? "1" : "0.55";
    shuffleBtn.title = shuffle ? "Tắt xáo trộn" : "Bật xáo trộn";
  }

  function clearPlayers() {
    [audio, video].forEach((media) => {
      media.pause();
      media.removeAttribute("src");
      media.load();
    });
    videoContainer.hidden = true;
    audio.style.display = "none";
    embedPlayer.innerHTML = "";
    activeMedia = null;
    playBtn.textContent = "▶️";
    seekBar.value = 0;
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
  }

  function getYouTubeInfo(url) {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    let list = url.searchParams.get("list") || "";

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else {
      id = url.searchParams.get("v") || "";
      if (!id) {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["shorts", "live", "embed"].includes(parts[0])) id = parts[1] || "";
      }
    }

    if (id && /^[\w-]{11}$/.test(id)) {
      return {
        id,
        embed: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1`,
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        list
      };
    }

    if (list && /^[\w-]+$/.test(list)) {
      return {
        id: "",
        embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`,
        thumbnail: DEFAULT_COVER,
        list
      };
    }
    return null;
  }

  function identifyLink(raw) {
    let url;
    try {
      url = new URL(raw);
      if (!["https:", "http:"].includes(url.protocol)) return null;
    } catch {
      return null;
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname;
    const filename = decodeURIComponent(path.split("/").pop() || "Media");
    const ext = (filename.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();

    if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(host)) {
      const info = getYouTubeInfo(url);
      if (!info) return null;
      return {
        type: "embed",
        platform: host === "music.youtube.com" ? "YouTube Music" : "YouTube",
        name: "YouTube",
        embed: info.embed,
        cover: info.thumbnail,
        height: 250
      };
    }

    if (host === "open.spotify.com") {
      const parts = path.split("/").filter(Boolean);
      const allowed = ["track", "album", "playlist", "episode", "show"];
      const index = parts.findIndex((part) => allowed.includes(part));
      if (index < 0 || !parts[index + 1]) return null;
      const type = parts[index];
      const id = parts[index + 1].split("?")[0];
      return {
        type: "embed",
        platform: "Spotify",
        name: `Spotify ${type}`,
        embed: `https://open.spotify.com/embed/${type}/${encodeURIComponent(id)}`,
        cover: DEFAULT_COVER,
        height: type === "track" ? 152 : 352
      };
    }

    if (host === "soundcloud.com" || host === "m.soundcloud.com") {
      return {
        type: "embed",
        platform: "SoundCloud",
        name: "SoundCloud",
        embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&auto_play=false&visual=true`,
        cover: DEFAULT_COVER,
        height: 300
      };
    }

    if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
      return { type: "audio", platform: "Link âm thanh", name: filename.replace(/\.[^.]+$/, ""), url: url.href, cover: DEFAULT_COVER };
    }

    if (["mp4", "webm", "ogv", "mov", "m4v"].includes(ext)) {
      return { type: "video", platform: "Link video", name: filename.replace(/\.[^.]+$/, ""), url: url.href, cover: DEFAULT_COVER };
    }

    if (["gif", "jpg", "jpeg", "png", "webp"].includes(ext)) {
      return { type: "image", platform: "Ảnh / GIF", name: filename.replace(/\.[^.]+$/, ""), url: url.href, cover: url.href };
    }

    // TikTok/Facebook không cung cấp link media trực tiếp ổn định cho trình phát HTML.
    if (host.includes("tiktok.com") || host.includes("facebook.com") || host === "fb.watch") {
      return { type: "unsupported", platform: host, name: "Liên kết mạng xã hội" };
    }
    return null;
  }

  function renderPlaylist() {
  playlistUI.innerHTML = "";
  songCount.textContent = `${songs.length} mục`;

  songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.className = index === currentIndex ? "active" : "";

    const info = document.createElement("div");
    info.className = "playlist-info";

    const name = document.createElement("strong");
    name.textContent = song.name;

    const platform = document.createElement("small");
    platform.textContent = song.platform;

    info.append(name, platform);

    info.addEventListener("click", () => {
      loadSong(index, true);
    });

    li.appendChild(info);

    // CHỈ HIỆN NÚT XÓA Ở PLAYLIST CỦA TÔI
    if (activePlaylist === "custom") {
      const remove = document.createElement("button");

      remove.className = "remove-song";
      remove.textContent = "×";
      remove.type = "button";
      remove.title = "Xóa bài hát";

      remove.addEventListener("click", (event) => {
        event.stopPropagation();

        if (activePlaylist !== "custom") return;

        removeSong(index);
      });

      li.appendChild(remove);
    }

    playlistUI.appendChild(li);
  });
}

  function addSong(song) {
    if (!song) {
      setStatus("Link chưa hợp lệ hoặc định dạng chưa được hỗ trợ.");
      return;
    }
    if (song.type === "unsupported") {
      setStatus("Link này không thể phát trực tiếp do giới hạn của Facebook/TikTok. Hãy dùng link MP4 trực tiếp hoặc trình phát chính thức.");
      return;
    }
    songs.push(song);
    renderPlaylist();
    if (currentIndex === -1) loadSong(0, false);
    setStatus(`Đã thêm: ${song.name}`);
  }

  function loadSong(index, autoplay = false) {
    if (index < 0 || index >= songs.length) return;
    currentIndex = index;
    const song = songs[index];

    clearPlayers();
    title.textContent = song.name;
    source.textContent = song.platform;
    cover.src = song.cover || DEFAULT_COVER;
    cover.onerror = () => { cover.onerror = null; cover.src = DEFAULT_COVER; };

    if (song.type === "audio" || song.type === "video") {
      activeMedia = song.type === "audio" ? audio : video;
      activeMedia.src = song.url;
activeMedia.volume = Number(volumeBar.value);
activeMedia.playbackRate = playbackSpeed;
activeMedia.load();

      if (song.type === "video") {
        videoContainer.hidden = false;
        video.style.display = "block";
      } else {
        audio.style.display = "block";
      }
      directControls.style.display = "block";
      setStatus(song.type === "video" ? "Video đã sẵn sàng." : "Nhạc đã sẵn sàng.");
      if (autoplay) playMedia();
    } else if (song.type === "embed") {
      // Giữ thanh điều khiển ARIZU hiển thị như giao diện cũ.
      // YouTube/Spotify/SoundCloud vẫn phát bằng nút bên trong iframe.
      directControls.style.display = "block";
      const iframe = document.createElement("iframe");
      iframe.src = song.embed;
      iframe.title = song.name;
      iframe.width = "100%";
      iframe.height = song.height || 250;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      embedPlayer.appendChild(iframe);
      setStatus(`Đang dùng trình phát chính thức của ${song.platform}. Các nút tua/lặp riêng của ARIZU không điều khiển được trình phát nhúng.`);
    } else if (song.type === "image") {
      directControls.style.display = "none";
      setStatus("Đã hiển thị ảnh/GIF làm ảnh bìa. Đây không phải tệp âm thanh hoặc video.");
    }
    renderPlaylist();
  }

  async function playMedia() {
    if (!activeMedia) {
      setStatus("Mục này dùng trình phát riêng hoặc không có âm thanh/video để phát.");
      return;
    }
    try {
      await activeMedia.play();
      playBtn.textContent = "Ⅱ";
    } catch (error) {
      setStatus("Không phát được. Hãy kiểm tra định dạng, đường link hoặc thao tác phát trên điện thoại.");
    }
  }

  function pauseMedia() {
    if (activeMedia) activeMedia.pause();
  }

  function togglePlay() {
    if (currentIndex === -1 && songs.length) {
      loadSong(0, true);
      return;
    }
    if (!activeMedia) {
      setStatus("Hãy dùng nút phát bên trong trình phát nền tảng.");
      return;
    }
    if (activeMedia.paused) playMedia();
    else pauseMedia();
  }

  function nextSong() {
    if (!songs.length) return;
    if (repeatMode === 2 && activeMedia) {
      activeMedia.currentTime = 0;
      playMedia();
      return;
    }

    let next;
    if (shuffle && songs.length > 1) {
      do { next = Math.floor(Math.random() * songs.length); }
      while (next === currentIndex);
    } else if (currentIndex < songs.length - 1) {
      next = currentIndex + 1;
    } else if (repeatMode === 1) {
      next = 0;
    } else {
      if (activeMedia) {
        activeMedia.pause();
        activeMedia.currentTime = 0;
      }
      playBtn.textContent = "▶️";
      setStatus("Đã phát hết playlist.");
      return;
    }
    loadSong(next, true);
  }

  function previousSong() {
    if (!songs.length) return;
    if (activeMedia && activeMedia.currentTime > 3) {
      activeMedia.currentTime = 0;
      return;
    }
    let previous;
    if (shuffle && songs.length > 1) {
      do { previous = Math.floor(Math.random() * songs.length); }
      while (previous === currentIndex);
    } else if (currentIndex > 0) {
      previous = currentIndex - 1;
    } else if (repeatMode === 1) {
      previous = songs.length - 1;
    } else {
      if (activeMedia) activeMedia.currentTime = 0;
      return;
    }
    loadSong(previous, true);
  }

  function removeSong(index) {

  // KHÓA XÓA NHẠC MẶC ĐỊNH
  if (activePlaylist !== "custom") {
    setStatus("Không thể xóa nhạc mặc định!");
    return;
  }

  // Chỉ thao tác trên danh sách người dùng
  const removed = customSongs[index];

  if (!removed) return;

  const wasCurrent = index === currentIndex;

  if (removed.objectUrl) {
    URL.revokeObjectURL(removed.objectUrl);
  }

  customSongs.splice(index, 1);

  songs = customSongs;

  saveCustomSongs();

  if (customSongs.length === 0) {
    clearPlayers();

    currentIndex = -1;

    title.textContent = "Chưa có bài hát";
    source.textContent = "ARIZU MUSIC PLAYER";
    cover.src = DEFAULT_COVER;

  } else if (wasCurrent) {
    currentIndex = -1;

    loadSong(
      Math.min(index, customSongs.length - 1),
      false
    );

  } else if (index < currentIndex) {
    currentIndex--;
  }

  renderPlaylist();

  setStatus("Đã xóa bài hát khỏi playlist của tôi.");
}

  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", previousSong);
  nextBtn.addEventListener("click", nextSong);
  rewindBtn.addEventListener("click", () => {
    if (activeMedia) activeMedia.currentTime = Math.max(0, activeMedia.currentTime - 10);
  });
  forwardBtn.addEventListener("click", () => {
    if (activeMedia && Number.isFinite(activeMedia.duration)) {
      activeMedia.currentTime = Math.min(activeMedia.duration, activeMedia.currentTime + 10);
    }
  });

  repeatBtn.addEventListener("click", () => {
    repeatMode = (repeatMode + 1) % 3;
    updateRepeatButton();
    setStatus(["Đã tắt lặp.", "Đang lặp toàn bộ playlist.", "Đang lặp một mục."][repeatMode]);
  });

  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    updateShuffleButton();
    setStatus(shuffle ? "Đã bật xáo trộn playlist." : "Đã tắt xáo trộn playlist.");
  });

  fileInput.addEventListener("change", (event) => {
    Array.from(event.target.files || []).forEach((file) => {
      if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) return;
      const objectUrl = URL.createObjectURL(file);
      addSong({
        type: file.type.startsWith("video/") ? "video" : "audio",
        name: file.name.replace(/\.[^.]+$/, ""),
        platform: file.type.startsWith("video/") ? "Video từ điện thoại" : "Nhạc từ điện thoại",
        url: objectUrl,
        objectUrl,
        cover: DEFAULT_COVER
      });
    });
    fileInput.value = "";
  });

  function addOnlineLink() {
    const raw = onlineUrl.value.trim();
    if (!raw) {
      setStatus("Hãy nhập link trước.");
      return;
    }
    const song = identifyLink(raw);
    if (!song) {
      setStatus("Không nhận diện được link. Hãy dùng YouTube, Spotify, SoundCloud hoặc link file MP3/MP4 trực tiếp.");
      return;
    }
    addSong(song);
    onlineUrl.value = "";
  }

  addOnline.addEventListener("click", addOnlineLink);
  onlineUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addOnlineLink();
  });

  [audio, video].forEach((media) => {
    media.addEventListener("loadedmetadata", () => {
      if (media === activeMedia) durationEl.textContent = formatTime(media.duration);
    });
    media.addEventListener("timeupdate", () => {
      if (media !== activeMedia) return;
      currentTimeEl.textContent = formatTime(media.currentTime);
      if (Number.isFinite(media.duration) && media.duration > 0) {
        seekBar.value = (media.currentTime / media.duration) * 100;
      }
    });
    media.addEventListener("play", () => {
      if (media === activeMedia) playBtn.textContent = "Ⅱ";
    });
    media.addEventListener("pause", () => {
      if (media === activeMedia) playBtn.textContent = "▶️";
    });
    media.addEventListener("ended", () => {
      if (media !== activeMedia) return;
      if (repeatMode === 2) {
        media.currentTime = 0;
        playMedia();
      } else {
        nextSong();
      }
    });
    media.addEventListener("error", () => {
      if (media === activeMedia) setStatus("Không tải được tệp. Hãy kiểm tra định dạng hoặc link trực tiếp.");
    });
  });

  seekBar.addEventListener("input", () => {
    if (activeMedia && Number.isFinite(activeMedia.duration)) {
      activeMedia.currentTime = (Number(seekBar.value) / 100) * activeMedia.duration;
    }
  });

  volumeBar.addEventListener("input", () => {
    [audio, video].forEach((media) => { media.volume = Number(volumeBar.value); });
  });

renderPlaylist();

if (songs.length > 0) {
  loadSong(0, false);
}

updateRepeatButton();
updateShuffleButton();

  const sections = document.querySelectorAll("section");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.15 });
    sections.forEach((section) => observer.observe(section));
  }

  const footer = document.querySelector("footer");
  if (footer) footer.textContent = `© ${new Date().getFullYear()} ARIZU. All rights reserved.`;
});

// ARIZU SNOW ANIMATION
document.addEventListener("DOMContentLoaded", () => {
  const snowContainer = document.getElementById("snow-container");
  if (!snowContainer) return;
  for (let i = 0; i < 45; i++) {
    const snow = document.createElement("span");
    snow.className = "snow";
    snow.textContent = "❄";
    snow.style.left = Math.random() * 100 + "%";
    snow.style.fontSize = (Math.random() * 12 + 7) + "px";
    snow.style.animationDuration = (Math.random() * 10 + 7) + "s";
    snow.style.animationDelay = (Math.random() * -15) + "s";
    snowContainer.appendChild(snow);
  }
});
