# ReportAudit AI 演示平台

基于 Vue 3、Vite、ECharts 的报告智能审核前端 Demo。包含房屋安全鉴定、幕墙安全鉴定、知识库管理和人员管理四个菜单。

## 在 VS Code 中运行

1. 用 VS Code 打开本目录：D:\Boss Jiang\project\ReportAudit AI\ai-audit-demo
2. 确认已安装 Node.js 20.19+ 或 22.12+。在 VS Code 中打开“终端 → 新建终端”。
3. 首次运行时，在没有启动开发服务的情况下安装依赖（本机当前已经安装好，可跳过）：

   ```powershell
   npm ci
   ```

4. 安装完成后，单独执行：

   ```powershell
   npm run dev
   ```

5. 打开终端显示的地址，默认是 http://localhost:5173/ 。以后启动项目只需执行 `npm run dev`。

如需重新执行 `npm ci`，先在运行 Vite 的终端按 `Ctrl+C` 停止服务，否则 Windows 可能占用 `rolldown` 原生模块并报 `EPERM`。

如果终端当前位于上一级 ReportAudit AI 文件夹，先执行：

   ```powershell
   cd ai-audit-demo
   ```

生产构建可执行 npm run build，产物在 dist 文件夹。

## 演示流程

- 在侧栏选择“房屋安全鉴定”或“幕墙安全鉴定”。
- 点击“上传新报告”或拖入本地 PDF。可使用项目上一级的 report 文件夹中的两份样例：房屋鉴定报告.pdf 和 01_报告_营迹路BG20YWAA2600001.pdf。
- 点击“开始智能审核”，观看进度与动效；完成后点击“预览问题”查看模拟标注。
- 点击“导出 PDF 报告”，浏览器会下载一份中文模拟审核报告。
- 历史记录保存在当前浏览器的 localStorage 中。原始 PDF 只在当前页面会话中预览，不会持久保存；刷新后历史记录只显示模拟结果。
- 知识库管理支持标准资料搜索、筛选、新增、查看、编辑、删除及 PDF 附件上传下载。标准信息保存在浏览器 localStorage，上传的附件保存在 IndexedDB。
- 人员管理支持基本信息搜索、筛选及增删改查，演示数据保存在浏览器 localStorage。

本项目仅用于界面及流程演示。问题、页码、统计值和导出结论均为虚拟数据，未进行真实 AI 识别、规范检索或合规判定。
