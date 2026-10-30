const zmq = require("zeromq");

async function main() {
  const socket = new zmq.Reply();

  await socket.bind("tcp://127.0.0.1:5555");
  console.log("Готов к игре...");

  let min;
  let max;
  let answer;

  for await (const [message] of socket) {
    try {
      const data = JSON.parse(message.toString());
      console.log("Сообщение клиента:", data);

      if (data.range) {
        const match = data.range.match(/^(-?\d+)-(-?\d+)$/);

        if (!match) {
          await socket.send(JSON.stringify({ error: "Некорректный диапазон" }));
          continue;
        }

        min = Number(match[1]);
        max = Number(match[2]);

        if (min > max) {
          await socket.send(JSON.stringify({ error: "Минимум больше максимума" }));
          continue;
        }

        answer = Math.floor((min + max) / 2);
        await socket.send(JSON.stringify({ answer }));
        continue;
      }

      if (data.hint === "more") {
        min = answer + 1;
      } else if (data.hint === "less") {
        max = answer - 1;
      } else if (data.hint === "correct") {
        await socket.send(JSON.stringify({ done: true }));
        console.log("Число угадано!");
        continue;
      } else {
        await socket.send(JSON.stringify({ error: "Неизвестная подсказка" }));
        continue;
      }

      if (min > max) {
        await socket.send(JSON.stringify({ error: "Подсказки противоречат друг другу" }));
        continue;
      }

      answer = Math.floor((min + max) / 2);
      await socket.send(JSON.stringify({ answer }));
    } catch (error) {
      console.error("Ошибка обработки сообщения:", error.message);
      await socket.send(JSON.stringify({ error: "Некорректное сообщение" }));
    }
  }
}

main().catch(console.error);
