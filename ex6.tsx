import { useCallback, useEffect, useReducer, useRef, useState } from "react";

type WebSocketState = "disconnected" | "connecting" | "connected" | "error";

function useWebSocket(url: string, onMessage: (_: string) => void): [WebSocketState, (_: string) => void] {
  const ws = useRef<WebSocket>();
  const [state, setState] = useState<WebSocketState>("disconnected");

  useEffect(() => {
    setState("connecting");
    const newWs = new WebSocket(url);
    newWs.onopen = () => setState("connected");
    newWs.onclose = () => setState("disconnected");
    newWs.onerror = () => setState("error");
    newWs.onmessage = (ev) => {
      ev.data.text().then((msg: string) => {
        console.log("RECV", msg);
        onMessage(msg);
      });
    };
    ws.current = newWs;
    return () => newWs.close();
  }, [url]);

  const send = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("SEND", message);
      ws.current.send(message);
    }
  }, []);

  return [state, send]
}

export default function Ex5() {
  console.log("Выполняем Ex5");

  const reducer = (prev: number, action: string): number => {
    if (action == "inc") {
      return prev + 1;
    }
    return prev;
  };

  const [state, dispatch] = useReducer(reducer, 10);

  // Метод, который вызывается при получении сообщения.
  const onMessage = useCallback(
    (msg: string) => {
      const data = JSON.parse(msg);
      console.log("Получили сообщение", data);
      dispatch(data);
    },
    [dispatch]
  );

  const [networkState, networkSend] = useWebSocket("ws://localhost:8080/", onMessage);

  // Обработчик клика.
  const onClickFunc = useCallback(() => {
    console.log("Нажали кнопку!");
    const action = "inc";
    dispatch(action);
    networkSend(JSON.stringify(action));
  }, [dispatch, networkSend]);

  return (
    <div className="container">
      <div className="row">
        <div className="col my-3 px-3 py-3">
          <h1>WS-Сетевые манипуляции с состоянием в React</h1>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <p>Состояние соединения: {networkState}</p>
          <p data-testid="output">Значение: [{state}]</p>
        </div>
        <div className="col">
          <button type="button" className="btn btn-primary" data-testid="inc" onClick={onClickFunc}>
            Увеличить
          </button>
        </div>
      </div>
    </div>
  );
}
