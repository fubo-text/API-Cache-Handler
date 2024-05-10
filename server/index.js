const Koa = require("koa");
const cors = require("@koa/cors");
const static = require("koa-static");
const Router = require("koa-router");

const app = new Koa();

const router = new Router();

router.get("/api/data", async (ctx, next) => {
  // 假设我们从数据库或其他地方获取一些数据
  // const data = { id: 2, name: "Koa Example Data" };
  // ctx.body = data;

  try {
    // 这里模拟数据获取等操作，可能会抛出异常
    throw new Error("Internal Server Error!"); // 模拟内部错误
  } catch (error) {
    console.error(error); // 打印错误日志

    // 设置响应状态码为500
    ctx.status = 500;
    ctx.body = { message: "Internal Server Error" };
  }
});

app.use(static(__dirname + "/"));

// 使用@koa/cors中间件解决跨域
app.use(
  cors({
    origin: "*", // 表示允许来自任何源的请求
  })
);

// app.use(async ctx => {
//   if (ctx.path === '/api/data' && ctx.method === 'GET') {
//     try {
//       // 这里模拟数据获取等操作，可能会抛出异常
//       throw new Error('Internal Server Error!'); // 模拟内部错误
//     } catch (error) {
//       console.error(error); // 打印错误日志

//       // 设置响应状态码为500
//       ctx.status = 500;
//       ctx.body = { message: 'Internal Server Error' };
//     }
//   }
// });

app.use(router.routes()).use(router.allowedMethods());

// 监听3000端口
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
