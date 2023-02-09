import { url } from "inspector";
import image from "next/image";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { isTokenKind } from "typescript";
export type pixel = { color: string, time: number, };
export type myState = {table:pixel[][], epoch:number};
export type set_pixel = {type:"set_pixel",x:number, y:number, color:string, time:number};
export type req = {type:"broadcast_req"};
export type rep = {type:"broadcast_rep", table:pixel[][]};
export type myAction = set_pixel | req | rep;

const get_time = () => {
    return (+new Date());
}
const N: number = 32;
export default function todo() {
    function getInitialState(): myState {
        let M:pixel[][] = new Array(N);
        for (let i = 0; i < 32; ++i) {
            M[i] = new Array(N);
            for (let j = 0; j < 32; ++j)
                M[i][j] = { color: 'white', time: 0 };
        }
        return {table:M, epoch: 0};
    }

    function reducer(state: myState, action: myAction): myState {
        let newState: myState = JSON.parse(JSON.stringify(state));
        switch (action.type) {
            case "set_pixel":
                let i = action.x;
                let j = action.y;
                newState.table[i][j] = {color:action.color, time:action.time};
                break;
            case "broadcast_rep":
                for (let i = 0; i < N; ++i) {
                    for (let j = 0; j < N; ++j) {
                        if (action.table[i][j].time > state.table[i][j].time) {
                            state.table[i][j] = action.table[i][j];
                        }
                    }
                }
                break;
            case "broadcast_req":
                newState.epoch++;
                break;
        }
        return newState;
    }


    const [state, dispatch] = useReducer(reducer, getInitialState());
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
  

    function processAction(action: myAction): void {
        // console.log("action:", action);
        dispatch(action);
        channel.current?.postMessage(JSON.stringify(action));
    }
    // useEffect(() => {
    //     if (networkState == "connected") {
    //         // console.log("CONNECTING")
    //         networkSend(JSON.stringify({ type: "broadcast_req" }));
    //     }
    // }, [networkState]);
    useEffect(() => {
        // console.log("epta:", JSON.stringify({ type: "broadcast_rep", data: state.table }));
        channel.current?.postMessage(JSON.stringify({ type: "broadcast_rep", table: state.table}));
        // console.log("sended:", state.items);
    }, [state.epoch]);

    const getRandomColor = () => {
        const index = ~~(Math.random() * colors.length);
        return { background: colors[index] };
    };
    const getColor = (color:string) => {
        return {background: color};
    }
    
    const [curColor, setColor] = useState("white");
    let colors:string[] = ["#DC143C", "#C71585", "#FFA07A", "#F0E68C", "#9400D3", "#DAA520", "#FF00FF","#FFFF00", "#008000", "#008080" , "#000000", "#C0C0C0" , "#FFFFFF"];
    const size = 25;
    const count = 32;
    const boxStyle = { width: (size * count) + "px", height: (size * count) + "px", background_color: "#bbbbbb" }
    const rowStyle = { width: (size * count) + "px", height: size + "px", background: "#bbbbbb" };
    const colStyle = { width: size + "px", height: size + "px", background_color: "#bbbbbb" };
    
    function setQuery (i:number, j:number, color:string):set_pixel {
        return {type:"set_pixel" ,x:i, y:j, color:color, time:get_time()};
    } 
    function doOnClick (i:number, j:number) {
        return () => {processAction(setQuery(i, j, curColor))};
    }
    function doPalette () {
        let ans = [];
        for (let i = 0; i < colors.length; ++i) {
            ans.push (
                <div style={{ ...colStyle, ...getColor(colors[i])}} onClick = {() => {setColor(colors[i])}} >
                </div>
            );
        }
        return(<div className="row" >
         {ans}    
        </div>);
    }
    function doJSX (M:pixel[][]) {
        let ans = [];
        for (let i:number = 0; i < N; ++i) {
            let ans2 = [];
            for (let j:number = 0; j < N; ++j) {
               ans2.push(<div style={{ ...colStyle, ...getColor(M[i][j].color)}} onMouseOver = {doOnClick(i, j)} ></div>);            
            }
            ans.push(<div className="d-flex align-content-start" style={rowStyle}> {ans2} </div>);
        }
        return ans;
    }
    
    return (
        <div className="container">
            <div className="mt-5 mx-2">
                {doPalette()}
            </div>
        
            <div className="mt-5" style={boxStyle}>
                {doJSX(state.table)}
            
            </div>
        </div>
    );
}