// const egg = require('egg')

// const workers = Number(process.env.EGG_WORKERS) || 1

// const startCluster = () => {
//   egg.startCluster({
//     workers,
//     baseDir: __dirname,
//     port: process.env.PORT || 7001,
//   })
// }
// module.exports = startCluster

const egg = require('egg');

const app = new egg.Application({
  env: process.env.NODE_ENV,
  mode: 'single',
});

app.ready().then(() => {
  console.log('egg started');
});

app.listen(process.env.PORT || 7002);