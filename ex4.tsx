import { useReducer } from "react";

const diskStyle = { background: "#f5222d" };
const emptyDiskStyle = {background: "#fff"};
const col2 = <div className="row">
<div className="col-2 offset-5" style={diskStyle}>
  &nbsp;
</div>
</div>;
const col4 = <div className="row">
<div className="col-4 offset-4" style={diskStyle}>
  &nbsp;
</div>
</div>;
const col8 = <div className="row">
<div className="col-8 offset-2" style={diskStyle}>
  &nbsp;
</div>
</div>;
const col12 = <div className="row">
<div className="col-12 offset-0" style={diskStyle}>
  &nbsp;
</div>
</div>;
const empty_column = <div className="row">
<div className="col-12 offset-0" style={emptyDiskStyle}>
  &nbsp;
</div>
</div>;
let html_columns = [col2, col4, col8, col12];
// let html_columns = [col12, col8, col4, col2];
export type column = number;
export type MyAction = { from:number, to:number, };
export type MyState = column[][];
export type MyReducer = (state: MyState, action: MyAction,) => MyState;
export type MyDispatch = (action: MyAction,) => void;
export function getInitialState(): MyState {
  return [[3, 2, 1, 0], [], []];
}
export function print_tower(tower:column[]):JSX.Element[]{  
  console.log("Обновляем башни", tower);
  let ans:JSX.Element[] = [];
  for (let i:number = 0; i < 4 - tower.length; ++i) {
    ans.push(empty_column);
  }
  // for (let i:number = 0; i < tower.length; ++i)
  for (let i:number = tower.length - 1; i >= 0; --i) {
    ans.push(html_columns[tower[i]]);
  }
  return ans;
};
export function reducer(state: MyState, action: MyAction): MyState {
  let newState:MyState = state.slice();
  console.log("Было:", newState);
  console.log("Обрабатываем действие '" + action.from + "->" + action.to + "'");
  let from = action.from, to = action.to;
  if (newState[from].length == 0) {
    return newState;
  }
  if (newState[to].length == 0) {
    newState[to].push(newState[from].pop());
    return newState;
  }
  let from_val = newState[from][newState[from].length - 1], to_val = newState[to][newState[to].length - 1];
  if (from_val < to_val) {
    newState[to].push(newState[from].pop());
    return newState;
  } 
  // console.log("Стало:", newState);
  return newState;
}
export default function Ex4() {
  
  const [columns, dispatch] = useReducer(reducer, getInitialState());
  console.log(col2);
  return (
    <div className="container">
      <div className="row my-5">
        <div className="col-12">
          <h1>Ханойские башни</h1>
        </div>
      </div>
      <div className="row">
        <div className="col-4 p-3">
          <div className="row text-center">
            <p>(Левая башня)</p>
          </div>
          {print_tower(columns[0])}
        </div>
        <div className="col-4 p-3">
          <div className="row text-center">
            <p>(Средняя башня)</p>
          </div>
          {print_tower(columns[1])}
        </div>
        <div className="col-4 p-3">
          <div className="row text-center">
            <p>(Правая башня)</p>
          </div>
          {print_tower(columns[2])}
        </div>
      </div>
      <div className="row">
        <div className="col-4 p-3 text-center">
          <div className="btn-group">
            <button type="button" className="btn btn-outline-primary" onClick={() => {dispatch({from:0, to:1})}}>
              {">"}
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={() => {dispatch({from:0, to:2})}}>
            {">>"}
            </button>
          </div>
        </div>
        <div className="col-4 p-3 text-center">
          <div className="btn-group">
            <button type="button" className="btn btn-outline-primary" onClick={() => {dispatch({from:1, to:0})}}>
              {"<"}
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={() => {dispatch({from:1, to:2})}}>
              {">"}
            </button>
          </div>
        </div>
        <div className="col-4 p-3 text-center">
          <div className="btn-group">
            <button type="button" className="btn btn-outline-primary" onClick={() => {dispatch({from:2, to:0})}}>
              {"<<"}
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={() => {dispatch({from:2, to:1})}}>
              {"<"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
