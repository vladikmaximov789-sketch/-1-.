const zmq = require("zeromq");

async function main() {
  const min = Number(process.argv[2]);
  const max = Number(process.argv[3]);

  if (
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min > max
  ) {
    console.error("Использование: node game-client.js <min> <max>");
    process.exit(1);
  }

  const secret = Math.floor(Math.random() * (max - min + 1)) + min;
  const socket = new zmq.Request();

  try {
    await socket.connect("tcp://127.0.0.1:5555");

    await socket.send(JSON.stringify({ range: `${min}-${max}` }));
    let response = JSON.parse((await socket.receive())[0].toString());

    while (true) {
      if (response.error) {
        throw new Error(response.error);
      }

      const guess = response.answer;
      console.log("Ответ сервера:", guess);

      if (guess < secret) {
        await socket.send(JSON.stringify({ hint: "more" }));
      } else if (guess > secret) {
        await socket.send(JSON.stringify({ hint: "less" }));
      } else {
        console.log("Сервер угадал число!");
        await socket.send(JSON.stringify({ hint: "correct" }));
        await socket.receive(); // Получаем подтверждение сервера
        break;
      }

      response = JSON.parse((await socket.receive())[0].toString());
    }
  } catch (error) {
    console.error("Ошибка:", error.message);
  } finally {
    socket.close();
  }
}

main();
