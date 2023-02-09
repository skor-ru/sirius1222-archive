import { useState } from "react";

export default function Ex2() {
  console.log("Выполняем Ex2");

  // TODO 1: Реализуйте простую переменную состояния
  // с использованием хука useState.

  // TODO 2: Добавьте кнопку с идентификатором dec,
  // которая будет уменьшать значение счетчика.
  
  const [value, setValue] = useState(17);
  
  const onClick = () => {
    console.log("Нажали кнопку!");
    setValue(value + 1);
  };
  const onClick_d = () => {
    console.log("Нажали кнопку!");
    setValue(value - 1);
  };
  return (
    <div className="container">
      <div className="row">
        <div className="col my-3 px-3 py-3">
          <h1>Простые манипуляции с состоянием в React</h1>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <p data-testid="output">Значение: [{value}]</p>
        </div>
        <div className="col">
          <button type="button" className="btn btn-primary" data-testid="inc" onClick={onClick}>
            Увеличить
          </button>
        </div>
        <div className="col">
          <button type="button" className="btn btn-primary" data-testid="inc" onClick={onClick_d}>
            Уменьшить
          </button>
        </div>
      </div>
    </div>
  );
}
