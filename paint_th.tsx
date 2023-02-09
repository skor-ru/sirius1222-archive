import { url } from "inspector";
import image from "next/image";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { isTokenKind } from "typescript";
import { Z_PARTIAL_FLUSH } from "zlib";
export type pixel = { color: string, time: number, };
export type myState = { table: pixel[][], epoch: number };
export type set_pixel = { type: "set_pixel", x: number, y: number, color: string, time: number };
export type req = { type: "broadcast_req" };
export type rep = { type: "broadcast_rep", table: pixel[][] };
export type pers = {x:number, y:number, color:string, time:number};
export type myAction = set_pixel | req | rep;
export type point = { i: number, j: number };
const get_time = () => {
    return (+new Date());
}
const N: number = 64;
export default function todo() {
    function getInitialState(): myState {
        let M: pixel[][] = new Array(N);
        for (let i = 0; i < N; ++i) {
            M[i] = new Array(N);
            for (let j = 0; j < N; ++j)
                M[i][j] = { color: 'white', time: 0 };
        }
        return { table: M, epoch: 0 };
    }

    function reducer(state: myState, action: myAction): myState {
        let newState: myState = JSON.parse(JSON.stringify(state));
        switch (action.type) {
            case "set_pixel":
                let i = action.x;
                let j = action.y;
                newState.table[i][j] = { color: action.color, time: action.time };
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
    const onMessage = useCallback(
        (msg: any) => {
            const data = JSON.parse(msg);
            // console.log("Получили сообщение", data);
            dispatch(data);
        },
        [dispatch]
    );

    const [networkState, networkSend] = useWebSocket("ws://159.89.100.148:8081/", onMessage);
    type WebSocketState = "disconnected" | "connecting" | "connected" | "error";

    function useWebSocket(url: string, onMessage: (_: string) => void): [WebSocketState, (_: string) => void] {
        const ws = useRef<WebSocket>();
        const [socket_state, setState] = useState<WebSocketState>("disconnected");

        useEffect(() => {
            setState("connecting");
            const newWs = new WebSocket(url);
            newWs.onopen = () => setState("connected");
            newWs.onclose = () => setState("disconnected");
            newWs.onerror = () => setState("error");
            newWs.onmessage = (ev) => {
                ev.data.text().then((msg: string) => {
                    // console.log("RECV", msg);
                    onMessage(msg);
                });
            };
            ws.current = newWs;
            return () => newWs.close();
        }, [url]);

        const send = useCallback((message: string) => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                //   console.log("SEND", message);
                ws.current.send(message);
            }
        }, []);

        return [socket_state, send]
    }

    function processAction(action: myAction): void {
        dispatch(action);
        networkSend(JSON.stringify(action));
    }
    useEffect(() => {
        if (networkState == "connected") {
            // console.log("CONNECTING")
            networkSend(JSON.stringify({ type: "broadcast_req" }));
        }
    }, [networkState]);
    useEffect(() => {
        // console.log("epta:", JSON.stringify({ type: "broadcast_rep", data: state.table }));
        networkSend(JSON.stringify({ type: "broadcast_rep", table: state.table }));
        // console.log("sended:", state.items);
    }, [state.epoch]);

    const getRandomColor = () => {
        const index = ~~(Math.random() * colors.length);
        return { background: colors[index] };
    };
    const getColor = (color: string) => {
        return { background: color };
    }

    const [draw, setVal] = useState(false);
    const [curColor, setColor] = useState("white");
    const [tool, setTool] = useState("brush")
    const [fPoint, setFPoint] = useState({ i: -1, j: -1 });
    let colors: string[] = ["#DC143C", "#C71585", "#FFA07A", "#F0E68C", "#9400D3", "#DAA520", "#FF00FF", "#FFFF00", "#008000", "#008080", "#000000", "#C0C0C0", "#FFFFFF"];
    // let operations: myAction[][] = [], cancelled: myAction[][] = [];
    function actionPush(curState: pers[][], action: pers[]) {
        let n = curState.length;
        let newState: pers[][] = curState.slice(n - 6, n - 1);
        if (action.length == 0) {
            if (newState.length > 0)
                newState.pop();
            return newState;
        }
        newState.push(action);
        return newState;
    }
    let stState: pers[][] = [];
    const [operations, pushOper] = useReducer(actionPush, stState);
    const [cancelled, pushCanc] = useReducer(actionPush, stState);
    const size = 12;
    const count = N;

    const boxStyle = { width: (size * count) + "px", height: (size * count) + "px", background_color: "#bbbbbb" }
    const rowStyle = { width: (size * count) + "px", height: size + "px", background: "#bbbbbb" };
    const colStyle = { width: size + "px", height: size + "px", background_color: "#bbbbbb" };
    const colStyle2 = { width: 4 * size + "px", height: 4 * size + "px", background_color: "#bbbbbb" };
    function setQuery(i: number, j: number, color: string): set_pixel {
        return { type: "set_pixel", x: i, y: j, color: color, time: get_time() };
    }
    function doOver(i: number, j: number) {
        // console.log(draw);
        return () => {
            if (draw && tool == "brush") {
                pushOper([{ x:i, y:j, color: state.table[i][j].color, time:get_time() }]);
                pushCanc([]);
                processAction(setQuery(i, j, curColor))
            }
        };
    }
    const max = (a: number, b: number) => { return (a > b ? a : b) };
    const min = (a: number, b: number) => { return (a < b ? a : b) };
    const abs = (a: number) => { return (a > 0 ? a : -a) };
    function doRound(p1: point, p2: point) {
        const dist2 = (p3: point, p4: point) => { let i = p3.i, j = p3.j, i1 = p4.i, j1 = p4.j; return (i - i1) * (i - i1) + (j - j1) * (j - j1); };
        let r2: number = dist2(p1, p2);
        let a: pers[] = [];
        console.log(p1, p2, r2);
        if (r2 == 8)
            r2 = 9;
        if (r2 == 2)
            r2 = 1;
        if (r2 <= 25) {
            for (let x: number = ~~max(0, p1.i - r2); x <= ~~min(N - 1, p1.i + r2); ++x) {
                for (let y = ~~max(0, p1.j - r2); y <= ~~min(p1.j + r2, N - 1); ++y) {
                    let curD = dist2({ i: x, j: y }, p1);
                    if (curD <= r2) {
                        console.log(p1, { i: x, j: y }, "dist:", curD);
                        a.push({ x:x, y:y, color: state.table[x][y].color, time:get_time() });
                        processAction(setQuery(x, y, curColor));
                    }
                }
            }
        }
        else if (r2 < 64) {
            for (let x: number = ~~max(0, p1.i - r2 ** (1 / 2) - 1); x <= ~~min(N - 1, p1.i + r2 ** (1 / 2) + 1); ++x) {
                for (let y = ~~max(0, p1.j - r2 ** (1 / 2) - 1); y <= ~~min(p1.j + r2 ** (1 / 2) + 1, N - 1); ++y) {
                    let curD = dist2({ i: x, j: y }, p1);
                    if (r2 - 9 <= curD && curD <= r2) {
                        console.log(p1, { i: x, j: y }, "dist:", curD);
                        a.push({ x:x, y:y, color: state.table[x][y].color, time:get_time() });
                        processAction(setQuery(x, y, curColor));
                    }
                }
            }
        } else if (r2 < 800) {
            
                for (let x: number = ~~max(0, p1.i - r2 ** (1 / 2) - 1); x <= ~~min(N - 1, p1.i + r2 ** (1 / 2) + 1); ++x) {
                    for (let y = ~~max(0, p1.j - r2 ** (1 / 2) - 1); y <= ~~min(p1.j + r2 ** (1 / 2) + 1, N - 1); ++y) {
                        let curD = dist2({ i: x, j: y }, p1);
                        if (r2 - r2 / 5 <= curD && curD <= r2) {
                            console.log(p1, { i: x, j: y }, "dist:", curD);
                            a.push({ x:x, y:y,  color: state.table[x][y].color, time:get_time() });
                            processAction(setQuery(x, y, curColor));
                        }
                    }
                }
            
        } else {
            for (let x: number = ~~max(0, p1.i - r2 ** (1 / 2) - 1); x <= ~~min(N - 1, p1.i + r2 ** (1 / 2) + 1); ++x) {
                for (let y = ~~max(0, p1.j - r2 ** (1 / 2) - 1); y <= ~~min(p1.j + r2 ** (1 / 2) + 1, N - 1); ++y) {
                    let curD = dist2({ i: x, j: y }, p1);
                    if (r2 - r2 / 7 <= curD && curD <= r2) {
                        console.log(p1, { i: x, j: y }, "dist:", curD);
                        a.push({ x:x, y:y,  color: state.table[x][y].color, time:get_time() });
                        processAction(setQuery(x, y, curColor));
                    }
                }
            }
        }
    pushOper(a);
    pushCanc([]);
    // console.log("bebra", a, operations);
}

function doRomb(p1:point, p2:point) {
    const dist = (p3: point, p4: point) => { let i = p3.i, j = p3.j, i1 = p4.i, j1 = p4.j; return abs(i - i1) + abs(j - j1)};
    let a: pers[] = [];
    let i = p1.i;
    let j = p1.j;
    let r = dist(p1, p2);
    for (let x: number = max(0, i - r); x <= min(N - 1, i + r); ++x) {
        for (let y = max(0, j - r); y <= min(N - 1, j + r); ++y) {
            let d = dist(p1, {i:x, j:y});
            if (r - 1 <= d && d <= r) {
                // console.log(i, j, x, y, "dist:", dist(i, j, x, y));
                a.push({ x:x, y:y, color: state.table[x][y].color, time:get_time() });
                processAction(setQuery(x, y, curColor));
            }
        }
    }
    processAction(setQuery(i, j, "red"));
    processAction(setQuery(p2.i, p2.j, "red"));
    pushOper(a);
    pushCanc([]);
}
function doSquare(p1: point, p2: point) {
    let i1 = p1.i, j1 = p1.j;
    let i2 = p2.i, j2 = p2.j;
    if (i1 > i2) {
        let t = i1;
        i1 = i2;
        i2 = t;
    }
    if (j1 > j2) {
        let t = j1;
        j1 = j2;
        j2 = t;
    }
    let a = [];
    for (let x = i1; x <= i2; ++x) {
        a.push({ x:x, y:j1, color: state.table[x][j1].color, time:get_time() });
        processAction(setQuery(x, j1, curColor));
        a.push({ x:x, y:j2, color: state.table[x][j2].color, time:get_time() });
        processAction(setQuery(x, j2, curColor));
    }
    for (let y = j1; y <= j2; ++y) {
        a.push({ x:i1, y:y, color: state.table[i1][y].color, time:get_time() });
        processAction(setQuery(i1, y, curColor));
        a.push({ x:i2, y:y, color: state.table[i2][y].color, time:get_time() });
        processAction(setQuery(i2, y, curColor));
    }
    pushOper(a);
    pushCanc([]);
}
function doHeart(i: number, j: number) {
    i -= 4;
    j -= 6;
    let a: pers[] = [];
    let mask: string[] = [
        "..##...##.",
        ".####.####..",
        "###########",
        "###########",
        ".#########.",
        "..#######..",
        "...#####...",
        "....###....",
        ".....#.....",
    ]
    for (let x = 0; x < 11 && i + x < N; ++x) {
        for (let y = 0; x < 9 && j + y < N; ++y) {
            if (x + i < 0 || y + j < 0)
                continue;
            if (mask[x][y] == '#') {
                // console.log(i, j, x, y, "dist:", dist(i, j, x, y));
                a.push({ x:i + x, y:j + y, color: state.table[i + x][j + y].color, time:get_time() });
                processAction(setQuery(i + x, j + y, curColor));
            }
        }
    }
    pushOper(a);
    pushCanc([]);
}
function doFigure(p1: point, p2: point) {
    console.log ("aboba", tool);
    switch (tool) {
        case "brush":
            pushOper([{x:p1.i, y:p1.j, color: state.table[p1.i][p1.j].color, time:get_time() }]);
            pushCanc([]);
            processAction(setQuery(p1.i, p1.j, curColor));
            break;
        case "round":
            doRound(p1, p2);
            break;
        case "square":
            doSquare(p1, p2);
            break;
        case "romb":
            doRomb(p1, p2);
            break;
        case "heart":
            doHeart(p1.i, p1.j);
            break;
    }
}
function cancelZ() {
    // console.log (operations.length);
    if (operations.length > 0) {
        let a: pers[] = [];
        for (let last of operations.at(-1)) {
            // console.log(last, state.table[last.x][last.y].color);
            a.push({ ...last, color: state.table[last.x][last.y].color, time:get_time() });
            processAction({...last, type:"set_pixel"});
        }
        pushCanc(a);
        pushOper([]);
    }
}
function cancelY() {
    if (cancelled.length > 0) {
        let a: pers[] = [];
        for (let last of cancelled.at(-1)) {
            a.push({ ...last, color: state.table[last.x][last.y].color, time:get_time() });
            processAction({...last, type:"set_pixel"});
        }
        // operations.push(a);
        pushOper(a);
        pushCanc([]);
        // cancelled.pop();
    }
}
function doPalette() {
    let ans = [];
    for (let i = 0; i < colors.length; ++i) {
        ans.push(
            <div key={i} style={{ ...colStyle2, ...getColor(colors[i]) }} onClick={() => { setColor(colors[i]) }} >
            </div>
        );
    }

    let n = colors.length;
    ans.push(
        <div key={n} style={{ ...colStyle2, ...getColor('white') }} onClick={() => { setTool("brush") }} >

            <p style={{ fontSize: "25px" }}>
                🖌️
            </p>
        </div>
    );
    ans.push(
        <div key={n + 1} style={{ ...colStyle2, ...getColor('white') }} onClick={() => { setTool("round") }} >

            <p style={{ fontSize: "30px" }}>
                ●
            </p>
        </div>
    );
    ans.push(
        <div key={n + 2} style={{ ...colStyle2, ...getColor('white') }} onClick={() => { setTool("romb") }} >

            <p style={{ fontSize: "30px" }}>
                ◆
            </p>
        </div>
    );
    ans.push(
        <div key={n + 3} style={{ ...colStyle2, ...getColor('white') }} onClick={() => { setTool("square") }} >

            <p style={{ fontSize: "30px" }}>
                ■
            </p>

        </div>
    );
    ans.push(
        <div key={n + 4} style={{ ...colStyle2, ...getColor('white') }} onClick={() => { cancelZ() }} >
            <p style={{ fontSize: "25px" }}>
                ←
            </p>

        </div>
    );
    ans.push(
        <div key={n + 5} style={{ ...colStyle2, ...getColor('white') }} onClick={() => { cancelY() }} >

            <p style={{ fontSize: "25px" }}>
                →
            </p>
        </div>
    );
    ans.push(
        <div key={n + 6} style={{ ...colStyle2, ...getColor('white') }} onClick={() => { setTool("heart") }} >

            <p style={{ fontSize: "25px" }}>
                ❤
            </p>
        </div>
    );

    return (<div className="row" >
        {ans}
    </div>);
}

function doJSX(M: pixel[][]) {
    let ans = [];
    for (let i: number = 0; i < N; ++i) {
        let ans2 = [];
        for (let j: number = 0; j < N; ++j) {
            ans2.push(<div key={i + "." + j} style={{ ...colStyle, ...getColor(M[i][j].color) }} onMouseDown={() => { setFPoint({ i: i, j: j }); }} onMouseUp={() => { doFigure(fPoint, { i: i, j: j }) }} onMouseOver={doOver(i, j)}></div>);
        }
        ans.push(<div key={i} className="d-flex align-content-start" style={rowStyle}> {ans2} </div>);
    }
    return ans;
}

const rangeStyle = { width: (size * count) + "px", height: size + "px", background: "#bbbbbb" };
return (
    <div className="container" onMouseEnter={() => { setVal(false) }} onMouseLeave={() => { setVal(false) }} onMouseDown={() => { setVal(true) }} onMouseUp={() => { setVal(false) }} >
        <div className="mt-5 mx-2">
            {doPalette()}
        </div>

        <div className="mt-5" style={boxStyle}>
            {doJSX(state.table)}
        </div>


    </div>
);
}