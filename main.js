// ==== ここを自分のGAS WebアプリURLに変更してください ====
// 例: const API_URL = "https://script.google.com/macros/s/xxxxxxxxxxxx/exec";
const API_URL = "https://script.google.com/macros/s/AKfycbwBKFBTXXGpRRtJJhBi13M6SmY7-YmhdpwGbQkfG12i-yUvK4E-WrnbmUmeNCrzx1Y/exec";

let meetings = [];
let currentYear = null;

// DOM取得
const statusEl = document.getElementById("status");
const yearTabsEl = document.getElementById("year-tabs");
const meetingsEl = document.getElementById("meetings");
const modalEl = document.getElementById("modal");
const modalTitleEl = document.getElementById("modal-title");
const modalSubEl = document.getElementById("modal-sub");
const modalExtraEl = document.getElementById("modal-extra");
const modalPdfsEl = document.getElementById("modal-pdfs");
const modalVideosEl = document.getElementById("modal-videos");
const modalCloseBtn = document.getElementById("modal-close");

// ---- 初期化 ----
document.addEventListener("DOMContentLoaded", () => {
  fetchMeetings();

  // モーダルの閉じるボタン
  modalCloseBtn.addEventListener("click", closeModal);

  // モーダル背景クリックで閉じる
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      closeModal();
    }
  });
});

// ---- APIから会議データ取得 ----
async function fetchMeetings() {
  try {
    statusEl.textContent = "読み込み中です…";

    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("APIエラー：" + res.status);
    }
    const data = await res.json();

    if (data.status !== "ok" || !Array.isArray(data.meetings)) {
      throw new Error("APIレスポンス形式が不正です。");
    }

    meetings = data.meetings;

    if (meetings.length === 0) {
      statusEl.textContent = "会議データが登録されていません。";
      return;
    }

    // 年度一覧（降順）
    const years = Array.from(new Set(meetings.map((m) => String(m.year))));
    years.sort().reverse();
    currentYear = years[0];

    renderYearTabs(years);
    renderMeetingCards();
    statusEl.textContent = ""; // 正常ならステータス消す
  } catch (err) {
    console.error(err);
    statusEl.textContent = "データ取得に失敗しました：" + err.message;
  }
}

// ---- 年度タブの描画 ----
function renderYearTabs(years) {
  yearTabsEl.innerHTML = "";

  years.forEach((year) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = year + "年度";

    const isActive = year === currentYear;
    btn.className =
      "px-3 py-1.5 rounded-full text-sm border transition " +
      (isActive
        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100");

    btn.addEventListener("click", () => {
      currentYear = year;
      renderYearTabs(years);
      renderMeetingCards();
    });

    yearTabsEl.appendChild(btn);
  });
}

// ---- 会議カードの描画 ----
function renderMeetingCards() {
  meetingsEl.innerHTML = "";

  const filtered = meetings.filter((m) => String(m.year) === String(currentYear));

  if (filtered.length === 0) {
    const p = document.createElement("p");
    p.className = "text-sm text-slate-500";
    p.textContent = "この年度の会議データはありません。";
    meetingsEl.appendChild(p);
    return;
  }

  filtered.forEach((m) => {
    const card = document.createElement("article");
    card.className =
      "bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 md:px-5 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2";

    const left = document.createElement("div");
    left.className = "space-y-1";

    const titleEl = document.createElement("h2");
    titleEl.className = "text-base md:text-lg font-semibold text-slate-900";
    titleEl.textContent = m.title || "(タイトル未設定)";

    const subEl = document.createElement("p");
    subEl.className = "text-xs text-slate-500";
    subEl.textContent = `${m.date || ""} ／ ${m.type || ""} ／ 対象：${
      m.target || ""
    }`;

    left.appendChild(titleEl);
    left.appendChild(subEl);

    if (m.location) {
      const locEl = document.createElement("p");
      locEl.className = "text-xs text-slate-500";
      locEl.textContent = `場所：${m.location}`;
      left.appendChild(locEl);
    }

    const right = document.createElement("div");
    right.className = "flex items-center gap-3 text-xs";

    const countEl = document.createElement("span");
    countEl.className = "hidden md:inline text-slate-500";
    const pdfCount = Array.isArray(m.pdfs) ? m.pdfs.length : 0;
    const videoCount = Array.isArray(m.videos) ? m.videos.length : 0;
    countEl.textContent = `PDF: ${pdfCount}件 ／ 動画: ${videoCount}件`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "資料を見る";
    btn.className =
      "inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs md:text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-sm";
    btn.addEventListener("click", () => openModal(m));

    right.appendChild(countEl);
    right.appendChild(btn);

    card.appendChild(left);
    card.appendChild(right);
    meetingsEl.appendChild(card);
  });
}

// ---- モーダルを開く ----
function openModal(meeting) {
  modalTitleEl.textContent = meeting.title || "";
  const subParts = [];

  if (meeting.date) subParts.push(meeting.date);
  if (meeting.type) subParts.push(meeting.type);
  if (meeting.target) subParts.push("対象：" + meeting.target);

  modalSubEl.textContent = subParts.join(" ／ ");

  const extraParts = [];
  if (meeting.location) extraParts.push("場所：" + meeting.location);
  if (meeting.note) extraParts.push("備考：" + meeting.note);
  modalExtraEl.textContent = extraParts.join(" ／ ");

  // PDFリスト描画
  modalPdfsEl.innerHTML = "";
  const pdfs = Array.isArray(meeting.pdfs) ? meeting.pdfs : [];
  if (pdfs.length === 0) {
    const p = document.createElement("p");
    p.className = "text-xs text-slate-500";
    p.textContent = "登録されているPDF資料はありません。";
    modalPdfsEl.appendChild(p);
  } else {
    pdfs.forEach((pdf) => {
      const a = document.createElement("a");
      a.href = pdf.url || "#";
      a.target = "_blank";
      a.rel = "noreferrer";
      a.className =
        "w-full inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50";
      a.innerHTML = `📄 <span>${pdf.title || "(タイトル未設定)"}</span>`;
      modalPdfsEl.appendChild(a);
    });
  }

  // 動画リスト描画
  modalVideosEl.innerHTML = "";
  const videos = Array.isArray(meeting.videos) ? meeting.videos : [];
  if (videos.length === 0) {
    const p = document.createElement("p");
    p.className = "text-xs text-slate-500";
    p.textContent = "登録されている動画はありません。";
    modalVideosEl.appendChild(p);
  } else {
    videos.forEach((video) => {
      const wrap = document.createElement("div");
      wrap.className = "space-y-1";

      const title = document.createElement("p");
      title.className = "font-medium";
      title.textContent = video.title || "(タイトル未設定)";

      const frameWrap = document.createElement("div");
      frameWrap.className =
        "aspect-video w-full rounded-lg overflow-hidden border border-slate-200";

      const iframe = document.createElement("iframe");
      iframe.src = video.url || "";
      iframe.className = "w-full h-full";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.title = video.title || "video";

      frameWrap.appendChild(iframe);
      wrap.appendChild(title);
      wrap.appendChild(frameWrap);
      modalVideosEl.appendChild(wrap);
    });
  }

  modalEl.classList.remove("hidden");
  modalEl.classList.add("flex");
  document.body.classList.add("modal-open");
}

// ---- モーダルを閉じる ----
function closeModal() {
  modalEl.classList.add("hidden");
  modalEl.classList.remove("flex");
  document.body.classList.remove("modal-open");
}
