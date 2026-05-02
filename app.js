const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ======================
// 这里改成你的 MySQL 密码！！
// ======================
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'study_clock',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 1. 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    const [exist] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (exist.length > 0) {
      return res.json({ code: 400, message: '用户名已存在' });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPwd, nickname || username]
    );

    res.json({ code: 200, message: '注册成功' });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', error: err.message });
  }
});

// 2. 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [user] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (user.length === 0) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    const isOk = await bcrypt.compare(password, user[0].password);
    if (!isOk) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    const { password: pwd, ...userInfo } = user[0];
    res.json({
      code: 200,
      message: '登录成功',
      data: userInfo
    });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 测试接口
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '服务运行正常' });
});
// ------------------------------
// 3. 用户打卡接口 (一天只能打一次)
// ------------------------------
app.post('/api/checkin', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.json({ code: 400, message: '用户ID不能为空' });
    }

    const today = new Date().toISOString().split('T')[0];

    // 查询今天是否已经打卡
    const [exists] = await pool.query(
      'SELECT id FROM checkins WHERE user_id = ? AND checkin_date = ?',
      [user_id, today]
    );

    if (exists.length > 0) {
      return res.json({ code: 400, message: '今天已经打卡过了' });
    }

    // 插入打卡记录
    await pool.query(
      'INSERT INTO checkins (user_id, checkin_date) VALUES (?, ?)',
      [user_id, today]
    );

    res.json({ code: 200, message: '打卡成功' });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

// ------------------------------
// 4. 获取用户打卡总天数 & 连续天数
// ------------------------------
app.get('/api/checkin/stats', async (req, res) => {
  try {
    const { user_id } = req.query;

    const [total] = await pool.query(
      'SELECT COUNT(*) AS total FROM checkins WHERE user_id = ?',
      [user_id]
    );

    res.json({
      code: 200,
      data: {
        total_days: total[0].total
      }
    });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 服务已启动：http://localhost:${PORT}`);
});