const { DataStore } = require('./src/lib/data-store');

async function main() {
  console.log("Finding user 'user-1780029402480'...");
  const user = await DataStore.findUserById('user-1780029402480');
  console.log("Result:", user);
  const emailUser = await DataStore.findUserByEmail('loldakec123@gmail.com');
  console.log("By Email:", emailUser);
}

main();
