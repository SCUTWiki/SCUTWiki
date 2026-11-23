<template>
  <div class="college-module">
    <div class="content-page">
      <div class="paper-texture"></div>

      <header class="page-header">
        <!-- 返回主页面按钮，样式与原版保持一致 -->
        <div class="back-btn" @click="goHome">← 返回主页面</div>
        <h2>学院图鉴</h2>
        <p>探索华工顶尖学术殿堂</p >
      </header>

      <div class="card-grid">
        <div
          v-for="(college, index) in colleges"
          :key="index"
          class="college-card"
          @click="goToCollege(college.path)"
        >
          <div class="card-corner"></div>
          <div class="card-icon">{{ college.icon }}</div>
          <h2>{{ college.name }}</h2>
          <p>{{ college.slogan }}</p >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 学院数据（已替换为百步梯学院）
const colleges = ref([
  { name: "计算机学院", icon: "💻", slogan: "Code is Law · 编织未来", path: "/college/cs" },
  { name: "机械与汽车", icon: "⚙️", slogan: "Precision & Power · 驱动世界", path: "/college/mech" },
  { name: "建筑学院", icon: "🏛️", slogan: "Form Follows Function · 构筑空间", path: "/college/arch" },
  { name: "电子与信息", icon: "⚡", slogan: "Connecting the World · 敏捷触达", path: "/college/ee" },
  { name: "化学与化工", icon: "⚗️", slogan: "Transmutation of Matter · 探索本质", path: "/college/chem" },
  { name: "百步梯学院", icon: "🎓", slogan: "Step by Step · 拾级而上", path: "/college/bbt" }
])

// 返回主页面
const goHome = () => {
  router.push('/') // 如果你的主页面路由不是 '/'，请改成比如 '/home'
}

const goToCollege = (path) => {
  // 详情页路由如果还没做，先保留 console
  // router.push(path)
  console.log("跳转到:", path)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Noto+Serif+SC:wght@400;600&display=swap');

/* ================= 全局设定 ================= */
.college-module {
  width: 100%; 
  min-height: 100vh; 
  overflow-x: hidden;
  background-color: #f7f6f2; 
  color: #1a1a1a;
  font-family: 'Playfair Display', 'Noto Serif SC', serif;
  position: relative;
}

.paper-texture {
  position: fixed; 
  top: 0; left: 0; 
  width: 100%; height: 100%;
  opacity: 0.04; 
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  z-index: 1;
}

/* ================= 内容页容器 ================= */
.content-page {
  width: 100%; 
  min-height: 100vh; 
  padding: 60px 10%;
  box-sizing: border-box; 
  position: relative; 
  z-index: 2;
}

/* ================= 页头与返回按钮 ================= */
.page-header { 
  text-align: center; 
  margin-bottom: 50px; 
  position: relative; 
}
.back-btn {
  position: absolute; 
  left: 0; 
  top: 10px;
  font-family: sans-serif; 
  font-size: 14px; 
  letter-spacing: 1px;
  color: #666; 
  cursor: pointer; 
  transition: color 0.3s;
}
.back-btn:hover { color: #1a1a1a; }
.page-header h2 { font-size: 40px; letter-spacing: 8px; margin-bottom: 10px; font-weight: 400; }
.page-header p { font-size: 14px; letter-spacing: 4px; color: #666; }

/* ================= 卡片网格 ================= */
.card-grid {
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
  gap: 30px;
}
.college-card {
  background: #ffffff; 
  padding: 50px 30px; 
  text-align: center;
  cursor: pointer; 
  position: relative; 
  border: 1px solid #e5e5e5;
  transition: all 0.4s ease;
}
.card-corner {
  position: absolute; 
  top: 0; left: 0; 
  width: 20px; height: 20px;
  border-top: 1px solid #1a1a1a; 
  border-left: 1px solid # 1a1a361a;
  opacity: px0; 
  transition: opacity 0.4s ease, transform 0.4s ease; 
  transform: translate(-5px, -5px);
}
.college-card:hover { 
  background: #fafafa; 
  box-shadow: 0 20px 40px rgba(0,0,0,0.03); 
  transform: translateY(-4px); 
}
.college-card:hover .card-corner { opacity: 1; transform: translate(0, 0); }
.card-icon {
  font-size:; 
  margin-bottom: 20px; 
  filter: grayscale(100%) opacity(0.8);
  transition: filter 0.4s ease, transform 0.4s ease;
}
.college-card:hover .card-icon { filter: grayscale(0%) opacity(1); transform: scale(1.1); }
.college-card h2 { font-size: 22px; font-weight: 600; margin-bottom: 12px; letter-spacing: 2px; }
.college-card p { font-size: 13px; color: #666; font-family: sans-serif; letter-spacing: 1px; }

/* ================= 桌面端断点适配 ================= */

/* 超宽屏 ≥1600px */
@media (min-width: 1600px) {
  .content-page { padding: 70px 14%; }
  .page-header h2 { font-size: 44px; letter-spacing: 10px; }
  .page-header p { font-size: 15px; letter-spacing: 5px; }
  .card-grid { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 36px; }
  .college-card { padding: 60px 36px; }
  .card-icon { font-size: 40px; }
  .college-card h2 { font-size: 24px; }
  .college-card p { font-size: 14px; }
}

/* 小桌面/分屏 1024–1279px */
@media (max-width: 1279px) {
  .content-page { padding: 50px 8%; }
  .page-header { margin-bottom: 42px; }
  .page-header h2 { font-size: 36px; letter-spacing: 6px; }
  .page-header p { font-size: 13px; letter-spacing: 3px; }
  .card-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
  .college-card { padding: 42px 26px; }
  .card-icon { font-size: 32px; margin-bottom: 16px; }
  .college-card h2 { font-size: 20px; letter-spacing: 1.5px; }
  .college-card p { font-size: 12px; }
}

/* 窄桌面/平板横屏 768–1023px */
@media (max-width: 1023px) {
  .content-page { padding: 40px 6%; }
  .page-header { margin-bottom: 36px; }
  .back-btn { top: 0; font-size: 13px; }
  .page-header h2 { font-size: 32px; letter-spacing: 5px; }
  .page-header p { font-size: 12px; letter-spacing: 2px; }
  .card-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
  .college-card { padding: 36px 20px; }
  .card-icon { font-size: 28px; margin-bottom: 14px; }
  .college-card h2 { font-size: 18px; letter-spacing: 1px; }
  .college-card p { font-size: 12px; letter-spacing: 0.5px; }
  .card-corner { width: 16px; height: 16px; }
}

/* 兜底：<768px (手机竖屏/极窄窗口) */
@media (max-width: 767px) {
  .content-page { padding: 32px 5%; }
  .page-header { margin-bottom: 28px; }
  .back-btn { position: static; display: inline-block; margin-bottom: 16px; }
  .page-header h2 { font-size: 28px; letter-spacing: 4px; }
  .page-header p { font-size: 12px; letter-spacing: 2px; }
  .card-grid { grid-template-columns: 1fr; gap: 16px; }
  .college-card { padding: 32px 20px; }
  .college-card:hover { transform: none; }
  .card-icon { font-size: 30px; }
  .college-card h2 { font-size: 18px; }
}
</style>