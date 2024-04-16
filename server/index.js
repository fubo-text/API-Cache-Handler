const Koa = require('koa');
const cors = require('@koa/cors');

const app = new Koa();

// 使用@koa/cors中间件解决跨域
app.use(cors({
  origin: '*' // 表示允许来自任何源的请求
}));

// 编写中间件处理GET请求
// app.use(async ctx => {
//   if (ctx.path === '/api/data' && ctx.method === 'GET') {
//     // 假设我们从数据库或其他地方获取一些数据
//     const data = { id: 2, name: 'Koa Example Data' };
//     // 将数据设置在响应体中返回
//     ctx.body = data;
//   }
// });


app.use(async ctx => {
  if (ctx.path === '/api/data' && ctx.method === 'GET') {
    try {
      // 这里模拟数据获取等操作，可能会抛出异常
      throw new Error('Internal Server Error!'); // 模拟内部错误
    } catch (error) {
      console.error(error); // 打印错误日志

      // 设置响应状态码为500
      ctx.status = 500;
      ctx.body = { message: 'Internal Server Error' };
    }
  }
});

// 监听3000端口
app.listen(3000, () => {
  console.log('Server running on port 3000');
});