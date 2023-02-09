import { useCallback, useEffect, useReducer, useRef } from "react";

export default function Ex5() {
  console.log("Выполняем Ex5");

  const reducer = (prev: number, action: string): number => {
    if (action === "inc") {
      return prev + 1;
    }
    return prev;
  };

  const [state, dispatch] = useReducer(reducer, 10);

  // Канал обмена информации.
  const channel = useRef<BroadcastChannel | null>();

  // Метод, который вызывается при получении сообщения.
  const onMessage = useCallback(
    (msg: any) => {
      const data = JSON.parse(msg);
      console.log("Получили сообщение", data);
      dispatch(data);
    },
    [dispatch]
  );

  // Открытие/закрытие канала.
  useEffect(() => {
    console.log("Открываем канал `ivan`");
    const bc = new BroadcastChannel("ivan");
    bc.onmessage = (ev) => onMessage(ev.data);
    channel.current = bc;
    return () => {
      console.log("Закрываем канал");
      channel.current = null;
      bc.close();
    };
  }, [channel, onMessage]);

  // Обработчик клика.
  const onClickFunc = () => {
    console.log("Нажали кнопку!");
    const action = "inc";
    dispatch(action);
    channel.current?.postMessage(JSON.stringify(action));
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col my-3 px-3 py-3">
          <h1>Сетевые манипуляции с состоянием в React</h1>
        </div>
      </div>
      <div className="row">
        <div className="col">
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
