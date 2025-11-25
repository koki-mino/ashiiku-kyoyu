// ==== ここを自分のGAS WebアプリURLに変更してください ====
// 例: const API_URL = "https://script.google.com/macros/s/xxxxxxxxxxxx/exec";
const API_URL = "https://script.google.com/macros/s/AKfycbzYVA72sPxctK9kCZl-bkMHYxNzdMWx-_WTNEjRXGNAwh5LGRsgk1W5AaUFcBc2DPcs/exec";

let meetings = [];
let notices = [];
let submissions = [];
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
const noticeListEl = document.getElementById("notice-list");
const submissionListEl = document.getElementById("submission-list");

// ---- 日付表示用フォーマット（2025-05-01 → 2025年5月1日(木)）----
function formatNoticeDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return dateStr;

  const dt = new Date(y, m - 1, d); // JSの月は0始まり
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdays[dt.getDay()];

  return `${y}年${m}月${d}日(${w})`;
}

// ---- 初期化 ----
document.addEventListener("DOMContentLoaded", () => {
  fetchAllData();

  // モーダルの閉じるボタン
  modalCloseBtn.addEventListener("click", closeModal);

  // モーダル背景クリックで閉じる
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      closeModal();
    }
  });
});

// ---- APIから全データ取得 ----
async function fetchAllData() {
  try {
    statusEl.innerHTML =
      '<span class="inline-flex h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span> 読み込み中です…';

    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("APIエラー：" + res.status);
    }
    const data = await res.json();

    if (data.status !== "ok") {
      throw new Error(data.message || "APIレスポンスがエラーになりました。");
    }

    meetings = Array.isArray(data.meetings) ? data.meetings : [];
    notices = Array.isArray(data.notices) ? data.notices : [];
    submissions = Array.isArray(data.submissions) ? data.submissions : [];

    // お知らせと提出物を先に描画
    renderNotices();
    renderSubmissions();

    if (meetings.length === 0) {
      statusEl.innerHTML =
        '<span class="inline-flex h-2 w-2 rounded-full bg-yellow-400"></span> 会議データが登録されていません。';
      renderYearTabs([]);
      renderMeetingCards();
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
    statusEl.innerHTML =
      '<span class="inline-flex h-2 w-2 rounded-full bg-red-400"></span> ' +
      "データ取得に失敗しました：" +
      err.message;
    // お知らせ・提出物だけでも描画
    renderNotices();
    renderSubmissions();
  }
}

// ---- お知らせ掲示板の描画（スマホ見やすい版） ----
function renderNotices() {
  if (!noticeListEl) return;
  noticeListEl.innerHTML = "";

  if (!Array.isArray(notices) || notices.length === 0) {
    const p = document.createElement("p");
    p.className = "text-xs md:text-sm text-slate-500";
    p.textContent = "現在、お知らせはありません。";
    noticeListEl.appendChild(p);
    return;
  }

  notices.forEach((n) => {
    const item = document.createElement("article");
    item.className =
      "p-3 rounded-xl border border-sky-100 bg-sky-50/60 hover:bg-sky-50 " +
      "transition-all shadow-sm hover:shadow-md space-y-1.5";

    // 上段：日付＋カテゴリ（横並び）
    const metaRow = document.createElement("div");
    metaRow.className =
      "flex items-center flex-wrap gap-2 text-[11px] md:text-xs";

    const dateSpan = document.createElement("span");
    dateSpan.className =
      "inline-flex items-center px-2 py-0.5 rounded-full bg-white text-slate-700 " +
      "border border-sky-200";
    dateSpan.textContent = formatNoticeDate(n.date || "");

    const cat = document.createElement("span");
    cat.className =
      "inline-flex items-center px-2 py-0.5 rounded-full " +
      "text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200";
    cat.textContent = n.category || "お知らせ";

    metaRow.appendChild(dateSpan);
    metaRow.appendChild(cat);

    // タイトル
    const title = document.createElement("h3");
    title.className = "text-xs md:text-sm font-semibold text-slate-800";
    title.textContent = n.title || "";

    // 本文
    const body = document.createElement("p");
    body.className =
      "text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap";
    body.textContent = n.body || "";

    item.appendChild(metaRow);
    item.appendChild(title);
    item.appendChild(body);

    noticeListEl.appendChild(item);
  });
}

// ---- 提出物一覧の描画 ----
function renderSubmissions() {
  if (!submissionListEl) return;
  submissionListEl.innerHTML = "";

  if (!Array.isArray(submissions) || submissions.length === 0) {
    const p = document.createElement("p");
    p.className = "text-xs md:text-sm text-slate-500";
    p.textContent = "現在、提出物情報はありません。";
    submissionListEl.appendChild(p);
    return;
  }

  submissions.forEach((s) => {
    const card = document.createElement("article");
    card.className =
      "bg-gradient-to-r from-white to-emerald-50 rounded-2xl border border-emerald-100 " +
      "px-3.5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 " +
      "shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-150";

    const left = document.createElement("div");
    left.className = "space-y-1";

    const titleRow = document.createElement("div");
    titleRow.className = "flex items-center gap-2 flex-wrap";

    const title = document.createElement("h3");
    title.className = "text-xs md:text-sm font-semibold text-slate-900";
    title.textContent = s.title || "(タイトル未設定)";

    const targetBadge = document.createElement("span");
    targetBadge.className =
      "inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 " +
      "text-[10px] font-medium border border-emerald-200";
    targetBadge.textContent = s.target ? `対象：${s.target}` : "対象：全体";

    titleRow.appendChild(title);
    titleRow.appendChild(targetBadge);

    const desc = document.createElement("p");
    desc.className =
      "text-xs md:text-sm text-slate-600 leading-relaxed";
    desc.textContent = s.description || "";

    left.appendChild(titleRow);
    left.appendChild(desc);

    const right = document.createElement("div");
    right.className =
      "flex flex-col items-end gap-2 text-right min-w-[140px]";

    const deadline = document.createElement("p");
    deadline.className = "text-xs md:text-sm text-slate-700";
    deadline.innerHTML = s.deadline
      ? `<span class="font-semibold text-rose-600">${s.deadline}</span> まで`
      : "期限未設定";

    right.appendChild(deadline);

    if (s.link) {
      const linkBtn = document.createElement("a");
      linkBtn.href = s.link;
      linkBtn.target = "_blank";
      linkBtn.rel = "noreferrer";
      linkBtn.className =
        "inline-flex items-center justify-center px-3 py-1.5 rounded-full " +
        "text-xs md:text-sm font-medium bg-sky-500 text-white hover:bg-sky-400 " +
        "shadow-sm hover:shadow-md transition-all border border-sky-400";
      linkBtn.textContent = "詳細・フォーマットを見る";
      right.appendChild(linkBtn);
    }

    card.appendChild(left);
    card.appendChild(right);
    submissionListEl.appendChild(card);
  });
}

// ---- 年度タブの描画 ----
function renderYearTabs(years) {
  yearTabsEl.innerHTML = "";

  if (!Array.isArray(years) || years.length === 0) {
    const p = document.createElement("p");
    p.className = "text-xs md:text-sm text-slate-500";
    p.textContent = "年度情報がありません。";
    yearTabsEl.appendChild(p);
    return;
  }

  years.forEach((year) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = year + "年度";

    const isActive = year === currentYear;
    btn.className =
      "px-3.5 py-1.5 rounded-full text-[11px] md:text-xs border transition-all " +
      "inline-flex items-center gap-1 shadow-sm " +
      (isActive
        ? "bg-sky-500 text-white border-sky-500 ring-2 ring-sky-300/80 font-semibold"
        : "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100");

    if (isActive) {
      const dot = document.createElement("span");
      dot.className = "h-1.5 w-1.5 rounded-full bg-white";
      btn.prepend(dot);
    }

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

  if (!Array.isArray(meetings) || meetings.length === 0) {
    const p = document.createElement("p");
    p.className = "text-sm text-slate-500";
    p.textContent = "会議データがありません。";
    meetingsEl.appendChild(p);
    return;
  }

  const filtered = meetings.filter(
    (m) => String(m.year) === String(currentYear)
  );

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
      "bg-gradient-to-r from-white to-sky-50 rounded-2xl border border-sky-100 " +
      "px-4 py-3 md:px-5 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 " +
      "shadow-sm hover:shadow-md hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-150";

    const left = document.createElement("div");
    left.className = "space-y-1";

    const titleEl = document.createElement("h2");
    titleEl.className = "text-sm md:text-base font-semibold text-slate-900";
    titleEl.textContent = m.title || "(タイトル未設定)";

    const subEl = document.createElement("p");
    subEl.className = "text-xs md:text-sm text-slate-600";
    subEl.textContent = `${m.date || ""} ／ ${m.type || ""} ／ 対象：${
      m.target || ""
    }`;

    left.appendChild(titleEl);
    left.appendChild(subEl);

    if (m.location) {
      const locEl = document.createElement("p");
      locEl.className = "text-xs md:text-sm text-slate-500";
      locEl.textContent = `場所：${m.location}`;
      left.appendChild(locEl);
    }

    const right = document.createElement("div");
    right.className =
      "flex items-center gap-3 text-[11px] md:text-xs";

    const countEl = document.createElement("span");
    countEl.className = "hidden md:inline text-slate-500";
    const pdfCount = Array.isArray(m.pdfs) ? m.pdfs.length : 0;
    const videoCount = Array.isArray(m.videos) ? m.videos.length : 0;
    countEl.textContent = `PDF: ${pdfCount}件 ／ 動画: ${videoCount}件`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "資料を見る";
    btn.className =
      "inline-flex items-center justify-center px-3.5 py-1.5 rounded-full " +
      "text-xs md:text-sm font-medium " +
      "bg-emerald-500 text-white hover:bg-emerald-400 " +
      "shadow-sm hover:shadow-md transition-all border border-emerald-400";
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
  const pdfList = Array.isArray(meeting.pdfs) ? meeting.pdfs : [];
  if (pdfList.length === 0) {
    const p = document.createElement("p");
    p.className = "text-xs md:text-sm text-slate-500";
    p.textContent = "登録されているPDF資料はありません。";
    modalPdfsEl.appendChild(p);
  } else {
    pdfList.forEach((pdf) => {
      const a = document.createElement("a");
      a.href = pdf.url || "#";
      a.target = "_blank";
      a.rel = "noreferrer";
      a.className =
        "w-full inline-flex items-center gap-2 px-3 py-2 rounded-xl " +
        "border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 " +
        "text-xs md:text-sm text-slate-800 transition-all";
      a.innerHTML = `📄 <span>${pdf.title || "(タイトル未設定)"}</span>`;
      modalPdfsEl.appendChild(a);
    });
  }

  // 動画リスト描画
  modalVideosEl.innerHTML = "";
  const videos = Array.isArray(meeting.videos) ? meeting.videos : [];
  if (videos.length === 0) {
    const p = document.createElement("p");
    p.className = "text-xs md:text-sm text-slate-500";
    p.textContent = "登録されている動画はありません。";
    modalVideosEl.appendChild(p);
  } else {
    videos.forEach((video) => {
      const wrap = document.createElement("div");
      wrap.className = "space-y-1";

      const title = document.createElement("p");
      title.className =
        "text-xs md:text-sm font-medium text-slate-800";
      title.textContent = video.title || "(タイトル未設定)";

      const frameWrap = document.createElement("div");
      frameWrap.className =
        "aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5";

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
