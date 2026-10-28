# 冥王星拯救计划：太阳系 N-Body 引力动力学与土星捕获模拟实验室 (Pluto Rescue & Saturn Capture Simulation)

基于 [NASA 行星科学数据库 (Planetary Fact Sheets)](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) 真实天体物理参数的交互式 N-Body 引力动力学仿真网页应用。直观演示冥王星受到小行星冲击脱离太阳系、利用行星发动机/火箭逆向拦截拉回太阳系，以及推向内太阳系时在土星希尔球（Hill Sphere）发生双曲引力弹弓飞掠或近星点逆向制动捕获成为土星卫星的全过程。

---

## ✨ 核心功能

1. **五大天体力学实验场景一键预设**
   - **① 冥王星原始椭圆轨道**：复现冥王星真实轨道（半长轴 `39.236 AU`，偏心率 `e = 0.2444`，近日点 `29.65 AU`，远日点 `48.83 AU`）。
   - **② 小行星撞击逃逸**：模拟顺行冲击使冥王星速度越过当地太阳逃逸速度（`6.715 km/s`），进入双曲逃逸轨道（`e > 1`）飞向银河系深空。
   - **③ 火箭拦截拉回太阳系**：在外太阳系启动高比冲行星发动机逆向减速，重新将日心总机械能降为负值（`E < 0`），恢复太阳系椭圆束缚轨道。
   - **④ 过度反向推向土星（双曲飞掠）**：演示单纯“向内推力过大”使冥王星坠向土星轨道时，因进入土星希尔球（`0.436 AU`）的双曲超速过高（`v_∞ ≥ 2.54~8.5 km/s`），在无制动情况下只能发生引力弹弓偏转而无法自动成为卫星。
   - **⑤ 推向土星 + 希尔球内逆向点火捕获成卫星**：演示在深入土星希尔球近星点（且高于土星洛希极限 `10.6万 km`）时，利用奥伯特效应（Oberth Effect）二次逆向点火刹车，将冥王星永久捕获为土星卫星。

2. **多维物理参数实时调节**
   - **脉冲变轨控制**：自由调节瞬时冲击/变轨速度增量 `Δv`（`0 ~ 15 km/s`）、脉冲方向角（`-180° ~ +180°`）及一键环日圆化制动。
   - **6 类发动机比冲与齐奥尔科夫斯基燃料核算**：支持切换 [SpaceX Raptor 3 真空化学火箭](https://en.wikipedia.org/wiki/SpaceX_Raptor)、氢氧火箭 RS-25、冥王星逃逸速度极限电推进、重核裂变脉冲推进、行星级氘氦-3聚变发动机及反物质光子火箭，自动计算推进剂消耗占冥王星总质量比例与所需发动机台数。
   - **土星引力井与希尔球可视化**：支持调节土星质量倍率（`0.5x ~ 20x`）、开启/关闭土星希尔球范围显示及近星点自动制动捕获。
   - **实时轨道遥测面板**：动态计算并显示日心速率、局部太阳逃逸速度、轨道偏心率 `e`、半长轴 `a`、相对土星速率、日心机械能与土星相对机械能。

---

## 📁 仓库目录结构

```text
pluto-rescue-simulation/
├── index.html                        # GitHub Pages 默认主页（模块化引入 CSS 与 JS）
├── pluto_rescue_simulation.html      # 单文件独立完整版（内联所有 CSS/JS，可单独双击运行或嵌入 iframe）
├── css/
│   └── style.css                     # 界面样式表（响应式深空暗色主题）
├── js/
│   └── simulation.js                 # Velocity Verlet N-Body 引力积分器与交互控制逻辑
├── docs/
│   └── pluto_gravity_analysis.md     # 冥王星脱离太阳系与土星捕获深度天体力学计算报告
├── LICENSE                           # MIT 开源许可证
└── README.md                         # 项目说明与 GitHub Pages 部署指南
```

---

## 🚀 快速运行与发布到 GitHub Pages

### 1. 本地直接运行
无需安装任何依赖或构建工具：
- 双击打开 `index.html` 或 `pluto_rescue_simulation.html` 即可在浏览器中完整运行；
- 或使用本地静态服务器预览：
  ```bash
  python3 -m http.server 8080
  # 浏览器访问 http://localhost:8080
  ```

### 2. 上传并发布到 GitHub Pages
1. 在 GitHub 上新建一个仓库（例如 `pluto-rescue-simulation`）。
2. 在解压后的文件夹终端中执行以下命令推送到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Pluto rescue & Saturn capture N-body gravity simulation"
   git branch -M main
   git remote add origin https://github.com/<你的GitHub用户名>/pluto-rescue-simulation.git
   git push -u origin main
   ```
3. 开启 **GitHub Pages** 在线访问：
   - 进入 GitHub 仓库页面，点击顶部 **Settings** -> 左侧菜单 **Pages**；
   - 在 **Build and deployment** -> **Branch** 下选择 `main` 分支和 `/ (root)` 目录，点击 **Save**；
   - 等待约 1 分钟后，即可通过 `https://<你的GitHub用户名>.github.io/pluto-rescue-simulation/` 在线访问并分享你的互动引力模拟网页！

---

## 📊 核心天体力学数据参考

详细的公式推导与数量级核算请参阅仓库内的 [docs/pluto_gravity_analysis.md](docs/pluto_gravity_analysis.md)，核心物理参数源自：
- [NASA Pluto Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html)
- [NASA Saturn Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html)
- [NASA Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html)

## 📄 许可证 (License)

本项目基于 [MIT License](LICENSE) 开源。
