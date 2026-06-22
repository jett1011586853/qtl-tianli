import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  ArrowSquareOut,
  GraduationCap,
  Headphones,
  MagnifyingGlass,
  MapPin,
  Play,
  RocketLaunch,
  ShieldCheck,
  Target,
} from "@phosphor-icons/react";
import { admissions } from "./data/admissions.js";
import { sources } from "./data/sources.js";
import {
  buildRecommendations,
  formatRank,
  predictRank,
  rankAtScore,
  YEARS,
} from "./lib/ranking.js";

const REGIONS = ["全部", "杭州", "成都", "武汉", "重庆", "天津", "北京", "山东", "深圳"];
const ASSET_BASE = `${import.meta.env.BASE_URL}assets/`;
const NETEASE_PLAYER = "https://music.163.com/outchain/player?type=2&id=1970560265&auto=0&height=66";
const NETEASE_SONG = "https://music.163.com/#/song?id=1970560265";

const SCENES = [
  {
    image: `${ASSET_BASE}scene-01.png`,
    eyebrow: "写给秦甜丽",
    title: "天已经亮了",
    body: "那些学到很晚的夜晚，不需要再证明什么。现在，轮到未来慢慢向你走来。",
    action: "戴上耳机，往前走",
    tone: "dark",
    position: "top",
  },
  {
    image: `${ASSET_BASE}scene-02.png`,
    eyebrow: "认真走过的路",
    title: "你真的已经很努力了",
    body: "那些认真写下的每一页，那些困得睁不开眼却没有敷衍的夜晚，都不会凭空消失。",
    footnote: "结果还没到来，但努力已经成立。",
    action: "把书合上",
    tone: "paper",
    position: "bottom",
  },
  {
    image: `${ASSET_BASE}scene-03.png`,
    eyebrow: "这一程已经走完",
    title: "现在，先好好休息",
    body: "不用立刻想清楚所有事情。睡个够，吹吹晚风，暂时没有计划也没关系。",
    footnote: "停下来不是落后。",
    action: "去看看更远的地方",
    tone: "light",
    position: "top",
  },
  {
    image: `${ASSET_BASE}scene-04.png`,
    eyebrow: "毕业季的一张照片",
    title: "有人一起走过",
    body: "努力不只有独自坚持，也有同学之间普通却珍贵的陪伴。以后去往不同方向，这一刻仍然会被好好记住。",
    action: "把照片收进手账",
    tone: "dark",
    position: "top",
  },
  {
    image: `${ASSET_BASE}scene-05.png`,
    eyebrow: "音乐把夜空点亮",
    title: "未来不止一种正确答案",
    body: "喜欢的歌给过你力量，而大学只是许多种生活的入口。去哪里、学什么，都可以慢慢选择。",
    action: "看看下一站",
    tone: "dark",
    position: "bottom",
  },
];

const CATEGORY_META = {
  rush: { label: "冲一冲", detail: "目标略高，值得勇敢试试", icon: RocketLaunch },
  match: { label: "稳一稳", detail: "位次接近，重点比较专业", icon: Target },
  safety: { label: "保一保", detail: "位次余量更大，留足安全垫", icon: ShieldCheck },
};

function MusicControl({ open, onToggle }) {
  return (
    <div className={`music-widget ${open ? "is-open" : ""}`}>
      <button
        className="music-control"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "收起音乐播放器" : "打开音乐播放器"}
        data-testid="music-control"
      >
        <span className="music-disc"><Play /></span>
        <span className="music-copy">
          <strong>天空没有极限</strong>
          <small>网易云官方播放器 · 邓紫棋</small>
        </span>
      </button>
      {open && (
        <aside className="music-popover" aria-label="网易云音乐播放器">
          <iframe
            title="G.E.M.邓紫棋《天空没有极限》"
            src={NETEASE_PLAYER}
            width="100%"
            height="86"
            frameBorder="0"
            allow="autoplay"
            loading="eager"
          />
          <a href={NETEASE_SONG} target="_blank" rel="noreferrer">
            如果播放器受限，去网易云打开 <ArrowSquareOut />
          </a>
        </aside>
      )}
    </div>
  );
}

function PixelCompanion({ frame = 0 }) {
  const column = frame % 4;
  const row = Math.floor((frame % 12) / 4);
  return (
    <div
      className="pixel-companion"
      aria-hidden="true"
      style={{
        backgroundPosition: `${(column / 3) * 100}% ${(row / 2) * 100}%`,
      }}
    />
  );
}

function StoryScene({ scene, index, onNext, onStartMusic }) {
  const handleNext = () => {
    if (index === 0) onStartMusic();
    onNext();
  };
  return (
    <section className={`story-scene scene-${index + 1}`} data-testid={`scene-${index + 1}`}>
      <img className="scene-image" src={scene.image} alt="" />
      <div className={`story-copy ${scene.tone} ${scene.position}`}>
        <p className="eyebrow">{scene.eyebrow}</p>
        <h1>{scene.title}</h1>
        <p className="story-body">{scene.body}</p>
        {scene.footnote && <p className="story-footnote">{scene.footnote}</p>}
        <button className="primary-action" onClick={handleNext} data-testid="story-next">
          {index === 0 && <Headphones weight="duotone" />}
          <span>{scene.action}</span>
          <ArrowRight weight="bold" />
        </button>
      </div>
      <PixelCompanion frame={[4, 7, 8, 5, 9][index]} />
    </section>
  );
}

function QueryScene({ score, setScore, region, setRegion, error, onQuery }) {
  return (
    <section className="query-scene" data-testid="scene-6">
      <img className="scene-image" src={`${ASSET_BASE}scene-06.png`} alt="" />
      <div className="query-panel">
        <div className="query-heading">
          <span className="query-icon"><BookOpenText weight="duotone" /></span>
          <div>
            <p className="eyebrow">河北 · 历史科目组合</p>
            <h1>看看分数能带你去哪里</h1>
          </div>
        </div>
        <label className="score-field">
          <span>高考分数</span>
          <input
            value={score}
            onChange={(event) => setScore(event.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            placeholder="请输入 200–700"
            aria-invalid={Boolean(error)}
            data-testid="score-input"
          />
          <b>分</b>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="region-label">先看哪个地区 <span>左右滑动查看更多</span></div>
        <div className="region-chips" role="group" aria-label="目标地区">
          {REGIONS.map((item) => (
            <button
              key={item}
              className={region === item ? "selected" : ""}
              onClick={() => setRegion(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="query-button" onClick={onQuery} data-testid="query-button">
          <MagnifyingGlass weight="bold" />
          打开我的城市清单
        </button>
        <p className="query-note">基于河北省教育考试院 2021–2025 历史类官方位次与投档数据</p>
      </div>
    </section>
  );
}

function HistorySummary({ result }) {
  return (
    <div className="history-summary">
      <div className="prediction-card">
        <div>
          <span>2026 回归估算位次</span>
          <strong>约 {formatRank(result.predicted)} 名</strong>
        </div>
        <small>参考区间 {formatRank(result.low)}–{formatRank(result.high)}</small>
      </div>
      <div className="rank-history" aria-label="往年同分位次">
        {result.observations.map(({ year, rank }) => (
          <div key={year}>
            <span>{year}</span>
            <b>{formatRank(rank)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramCard({ item }) {
  const recent = item.history[0];
  return (
    <article className="program-card">
      <div className="program-main">
        <div className="program-title">
          <h3>{item.school}</h3>
          <span className="location"><MapPin weight="fill" />{item.city}</span>
        </div>
        <p>{item.major}</p>
        <div className="badges">
          {item.badge !== "普通" && <span className="badge elite">{item.badge}</span>}
          <span className={`badge ${item.level === "专科" ? "vocational" : "undergrad"}`}>{item.level}</span>
          <span className={`badge ${item.ownership === "民办" ? "private" : "public"}`}>{item.ownership}</span>
          <span className="badge years">{item.history.length} 年记录</span>
        </div>
      </div>
      <div className="program-score">
        <strong>{recent.score}</strong>
        <span>{recent.year} 最低分</span>
        <small>中位位次 {formatRank(item.benchmarkRank)}</small>
      </div>
    </article>
  );
}

function RecommendationSection({ category, items }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <section className={`recommendation-section ${category}`}>
      <header>
        <span className="category-icon"><Icon weight="duotone" /></span>
        <div>
          <h2>{meta.label}</h2>
          <p>{meta.detail}</p>
        </div>
        <b>{items.length}</b>
      </header>
      <div className="program-list">
        {items.length ? items.map((item) => <ProgramCard key={`${item.school}-${item.city}-${item.level}-${item.major}-${category}`} item={item} />) : <p className="empty-state">当前筛选下暂时没有合适记录，试试“全部”地区或清空搜索。</p>}
      </div>
    </section>
  );
}

function ResultsScene({ score, result, region, setRegion, onBack, onFinish }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const recommendations = useMemo(
    () => buildRecommendations(admissions, result.predicted, region, search),
    [result.predicted, region, search],
  );
  const grouped = useMemo(() => {
    const limit = showAll ? 30 : 6;
    return {
      rush: recommendations.filter((item) => item.category === "rush").slice(0, limit),
      match: recommendations.filter((item) => item.category === "match").slice(0, limit),
      safety: recommendations.filter((item) => item.category === "safety").slice(0, limit),
    };
  }, [recommendations, showAll]);

  return (
    <section className="results-scene" data-testid="scene-7">
      <div className="results-hero">
        <img src={`${ASSET_BASE}scene-07.png`} alt="" />
        <button className="back-button" onClick={onBack}><ArrowLeft />修改分数</button>
        <div className="results-title">
          <p className="eyebrow">秦甜丽的城市清单</p>
          <h1>{score} 分，不只一个答案</h1>
          <p>先用位次找范围，再慢慢比较城市、专业和真正想过的生活。</p>
        </div>
      </div>
      <div className="results-paper">
        <HistorySummary result={result} />
        <div className="result-tools">
          <div className="region-chips results-regions">
            {REGIONS.map((item) => (
              <button key={item} className={region === item ? "selected" : ""} onClick={() => setRegion(item)}>{item}</button>
            ))}
          </div>
          <label className="search-field">
            <MagnifyingGlass />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索院校或专业" />
          </label>
        </div>
        <div className="category-explainer">
          <span><i className="rush-dot" />冲：目标位次略高</span>
          <span><i className="match-dot" />稳：位次接近</span>
          <span><i className="safety-dot" />保：位次余量更大</span>
        </div>
        <RecommendationSection category="rush" items={grouped.rush} />
        <RecommendationSection category="match" items={grouped.match} />
        <RecommendationSection category="safety" items={grouped.safety} />
        <button className="show-more" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "收起清单" : "每档查看更多"}<ArrowDown className={showAll ? "rotated" : ""} />
        </button>
        <div className="source-note">
          <GraduationCap weight="duotone" />
          <div>
            <h3>数据说明</h3>
            <p>位次来自河北省教育考试院 2021–2025 历史科目组合成绩统计表；专业最低分来自同期本科、专科平行投档表。2026 位次为线性回归估算，不能替代当年招生章程、选科要求和正式志愿咨询。</p>
            <div className="source-links">
              {sources.ranks.map(([year, href]) => <a key={year} href={href} target="_blank" rel="noreferrer">{year} 位次表<ArrowSquareOut /></a>)}
              <a href={sources.admissions} target="_blank" rel="noreferrer">历年投档原表<ArrowSquareOut /></a>
            </div>
          </div>
        </div>
        <button className="finish-button" onClick={onFinish}>收好清单，继续往前<ArrowRight /></button>
      </div>
    </section>
  );
}

function ClosingScene({ onRestart }) {
  return (
    <section className="closing-scene" data-testid="scene-8">
      <img className="scene-image" src={`${ASSET_BASE}scene-08.png`} alt="" />
      <div className="closing-letter">
        <p className="eyebrow">写给未来的秦甜丽</p>
        <h1>愿你一直有选择，也一直敢于期待</h1>
        <p>不管分数最后把你带到哪座城市，你都不是被一个数字决定的人。</p>
        <p>可以冲一冲，也可以稳稳地走；可以去很远的地方，也可以在新的生活里重新认识自己。</p>
        <p className="closing-emphasis">你已经完成了很难的一程。下一程，不必害怕。</p>
        <button className="primary-action" onClick={onRestart}>再看一遍<ArrowRight /></button>
      </div>
    </section>
  );
}

export function App() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [direction, setDirection] = useState("forward");
  const [score, setScore] = useState("");
  const [region, setRegion] = useState("全部");
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const pointerStart = useRef(null);

  const goTo = (nextIndex) => {
    const bounded = Math.max(0, Math.min(7, nextIndex));
    setDirection(bounded >= sceneIndex ? "forward" : "backward");
    setSceneIndex(bounded);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleMusic = () => setMusicOpen((current) => !current);

  const submitScore = () => {
    const numericScore = Number(score);
    if (!Number.isInteger(numericScore) || numericScore < 200 || numericScore > 700) {
      setFormError("请输入 200–700 之间的有效分数");
      return;
    }
    setFormError("");
    setResult(predictRank(numericScore));
    goTo(6);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowRight" && sceneIndex < 7 && sceneIndex !== 6) goTo(sceneIndex + 1);
      if (event.key === "ArrowLeft" && sceneIndex > 0) goTo(sceneIndex - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sceneIndex]);

  const handlePointerDown = (event) => {
    if (event.target.closest("button, input, a")) return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event) => {
    if (!pointerStart.current || sceneIndex === 6) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(deltaX) < 55 && Math.abs(deltaY) < 70) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) goTo(sceneIndex + (deltaX < 0 ? 1 : -1));
    else goTo(sceneIndex + (deltaY < 0 ? 1 : -1));
  };

  let content;
  if (sceneIndex < 5) {
    content = <StoryScene scene={SCENES[sceneIndex]} index={sceneIndex} onNext={() => goTo(sceneIndex + 1)} onStartMusic={toggleMusic} />;
  } else if (sceneIndex === 5) {
    content = <QueryScene score={score} setScore={setScore} region={region} setRegion={setRegion} error={formError} onQuery={submitScore} />;
  } else if (sceneIndex === 6 && result) {
    content = <ResultsScene score={Number(score)} result={result} region={region} setRegion={setRegion} onBack={() => goTo(5)} onFinish={() => goTo(7)} />;
  } else if (sceneIndex === 6) {
    content = <QueryScene score={score} setScore={setScore} region={region} setRegion={setRegion} error={formError} onQuery={submitScore} />;
  } else {
    content = <ClosingScene onRestart={() => goTo(0)} />;
  }

  return (
    <main
      className={`app-shell transition-${direction} ${sceneIndex === 6 ? "is-results" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <header className="top-bar">
        <span className="site-name">写给秦甜丽</span>
        <MusicControl open={musicOpen} onToggle={toggleMusic} />
      </header>
      <div key={sceneIndex} className="scene-transition">{content}</div>
      {sceneIndex !== 6 && (
        <nav className="scene-progress" aria-label="页面进度">
          {Array.from({ length: 8 }, (_, index) => (
            <button key={index} className={sceneIndex === index ? "active" : ""} onClick={() => goTo(index)} aria-label={`第 ${index + 1} 页`} />
          ))}
        </nav>
      )}
    </main>
  );
}
