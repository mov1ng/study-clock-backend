// 导入依赖包
const express = require('express');
const cors = require('cors');

// 创建 Express 应用
const app = express();
const PORT = 3000; // 后端运行的端口号

// 配置中间件
app.use(cors()); // 允许前端跨域访问
app.use(express.json()); // 解析 JSON 格式的请求数据

// 测试接口：验证后端是否正常运行
app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    message: '✅ 后端服务运行正常！',
    data: null
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动，地址：http://localhost:${PORT}`);
});