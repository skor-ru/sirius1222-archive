import { stat } from "fs";
import React, { useReducer } from "react";

export type MyAction = { kind:string; value: number; };
export type MyState = { x: number; y: number; s: number; };
export type MyReducer = (state: MyState, action: MyAction,) => MyState;
export type MyDispatch = (action: MyAction,) => void;;

export function createUpdateXAction(value: number): MyAction {
  return { kind: "updateX", value: value };
}
export function createUpdateYAction(value: number): MyAction {
  return { kind: "updateY", value: value };
}
export function getInitialState(): MyState {
  return { x: 17, 
    y: 25, 
    s: 42, 
  };
}

export function reducer(state: MyState, action: MyAction): MyState {
  console.log("Обрабатываем действие '" + action.kind + "'");
  let newState:MyState;
  switch (action.kind) {
    case "updateX":
      // TODO: Поправьте, чтобы не нарушался инвариант x+y==s.
      newState = {...state, x: action.value};
      newState.s = newState.x + newState.y;
      return newState;
    case "updateY":
      newState = {...state, y: action.value};
      newState.s = newState.x + newState.y;
      return newState;
    case "multiplyS":
      newState = {x:state.s, y:state.s, s:state.s * 2};
      return newState;
    case "divideS":
      newState = {x:state.s / 4, y:state.s / 4, s:state.s / 2};
      return newState;
    }
    return state;
}

export default function Ex3() {
  console.log("Выполняем Ex3");

  // TODO: Реализуйте композитное состояние с использованием хука useReducer.
  // Чеклист, что нужно сделать:
  // - поддержать действие Update Y при изменении второго поля ввода - done
  // - сделать коды обработчиков действий Update X & Update Y корректными - done
  // - провязать элементы управления (поля ввода) с корректными переменными состояния
  // - реализовать новые действия, обработчики для них для двух кнопок внизу

  const [state, dispatch] = useReducer(reducer, getInitialState());

  const onChangeX = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log("Новое значение: [" + value + "]");
    // Фиксируем произошедшее действие.
    dispatch(createUpdateXAction(parseFloat(value)));
  };
  const onChangeY = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log("Новое значение: [" + value + "]");
    // Фиксируем произошедшее действие.

    dispatch(createUpdateYAction(parseFloat(value)));
  };
  const onClickMultiply = () => {
    dispatch({kind:"multiplyS", value:2});
  };
  const onClickDivide = () => {
    dispatch({kind:"divideS", value:2});
  };
  return (
    <div className="container">
      <div className="row">
        <div className="col my-3 px-3 py-3">
          <h1>Более сложные манипуляции с состоянием в React</h1>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col">
          <div className="input-group">
            <span className="input-group-text">X</span>
            <input className="form-control" type="text" value={state.x} onChange={onChangeX} />
            <span className="input-group-text">+</span>
            <span className="input-group-text">Y</span>
            <input className="form-control" type="text" value={state.y} onChange={onChangeY}/>
            <span className="input-group-text">=</span>
            <span className="input-group-text">S</span>
            <input className="form-control" type="text" disabled={true} value={state.s} />
          </div>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col">
          <button type="button" className="btn btn-primary" onClick={onClickMultiply}>
            Умножить общую сумму на два и уравнять слагаемые
          </button>
        </div>
        <div className="col">
          <button type="button" className="btn btn-primary" onClick={onClickDivide}>
            Поделить общую сумму на два и уравнять слагаемые
          </button>
        </div>
      </div>
    </div>
  );
}
