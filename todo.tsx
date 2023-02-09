import image from "next/image";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { isTokenKind } from "typescript";

export type ToDoItem = { text: string, done: boolean, UUID: number, deleted: boolean, time: number };
export type MyState = { items: ToDoItem[], epoch: number, };
export type insertAction = { type: "add", UUID: number, text: string, time: number };
export type eraseAction = { type: "del", UUID: number, };
export type checkAction = { type: "upd", UUID: number, nval: boolean, };
export type requestAction = { type: "broadcast_req" };
export type replyAction = { type: "broadcast_reply", data: ToDoItem[] };
export type MyAction = insertAction | eraseAction | checkAction | requestAction | replyAction;

//export type MyReducer = (state: MyState, action: MyAction,) => MyState;
//export type MyDispatch = (action: MyAction,) => void;
const get_id = () => {
    return Math.floor(Math.random() * (1_000_000));
}
const get_time = () => {
    return (+new Date());
}
export default function todo() {
    function InitialInput(): string {
        return "";
    }
    function inputReducer(Input: string, action: string): string {
        let newState = action;
        return newState;
    }
    function getInitialState(): MyState {
        return { items: [], epoch: 0 };
    }
    function delQuery(UUID: number): eraseAction {
        return { type: "del", UUID: UUID };
    }
    function addQuery(text: string,): insertAction {
        return { type: "add", text: text, UUID: get_id(), time: get_time() };
    }
    function flagQuery(UUID: number, f: boolean): checkAction {
        return { type: "upd", nval: f, UUID: UUID };
    }
    function itemsMerge(items1: ToDoItem[], items2: ToDoItem[]) {
        let merged: ToDoItem[] = [];
        let usedId = new Set();
        for (let cur of items1) {
            if (!usedId.has(cur.UUID)) {
                merged.push(cur);
                usedId.add(cur.UUID);
            }
        }
        for (let cur of items2) {
            if (!usedId.has(cur.UUID)) {
                merged.push(cur);
                usedId.add(cur.UUID);
            }
        }
        return merged;
    }

    function reducer(state: MyState, action: MyAction): MyState {
        console.log("In reducer: {", state, action);
        let newState: MyState = JSON.parse(JSON.stringify(state));
        let pos: number;
        switch (action.type) {
            case "add":
                newState.items.push({ text: action.text, done: false, UUID: action.UUID, deleted: false, time: action.time });
                newState.items.sort((a, b) => a.time - b.time);
                break;
            case "del":
                pos = -1;
                for (let i = 0; i < newState.items.length; ++i) {
                    if (newState.items[i].UUID == action.UUID) {
                        pos = i;
                    }
                }
                if (pos != -1)
                    newState.items[pos].deleted = true;
                break;
            case "upd":
                pos = -1;
                for (let i = 0; i < newState.items.length; ++i) {
                    if (newState.items[i].UUID == action.UUID) {
                        pos = i;
                    }
                }
                if (pos != -1)
                    newState.items[pos].done = action.nval ? true : false;
                break;
            case "broadcast_req":
                newState.epoch++;
                break;
            case "broadcast_reply":
                console.log("aboba: ", action.data);
                newState = { ...newState, items: itemsMerge(action.data, newState.items) };
                newState.items.sort((a, b) => a.time - b.time);
                break;
        }
        console.log(newState, "}");

        return newState;
    }
    function printItem(item: ToDoItem) {
        if (item.done)
            return <em><s>{item.text}</s></em>
        return <>{item.text}</>
    }
    function getJSX(item: ToDoItem, idx: number): JSX.Element {
        if (item.deleted)
            return <></>;
        return (

            <div className="row">
                <div className="col-1 p-4">
                    <input className="form-check-input" type="checkbox" checked={item.done} onChange={() => { processAction(flagQuery(state.items[idx].UUID, !item.done)) }} />
                </div>
                <div className="col-10 p-4">
                    <div className="row text">
                        {printItem(item)}
                    </div>
                </div>
                <div className="col-1 p-3">
                    <button type="button" className="btn btn-primary" onClick={() => { processAction(delQuery(state.items[idx].UUID)) }}>
                        {"-"}
                    </button>
                </div>
            </div>
        );
    }
    const InputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        dispatchInput(value);
    };
    function printItems() {
        let ans = [];
        for (let i: number = 0; i < state.items.length; ++i) {
            ans.push(getJSX(state.items[i], i));
        }
        return ans;
    }

    const [state, dispatch] = useReducer(reducer, getInitialState());
    const [Input, dispatchInput] = useReducer(inputReducer, InitialInput());
    const onMessage = useCallback(
        (msg: any) => {
            const data = JSON.parse(msg);
            // console.log("Получили сообщение", data);
            dispatch(data);
        },
        [dispatch]
    );

    const [networkState, networkSend] = useWebSocket("ws://159.89.100.148:8080/", onMessage);
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

    function processAction(action: MyAction): void {
        // console.log("action:", action);
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
        // console.log("epta:", JSON.stringify({ type: "broadcast_reply", data: state.items }));
        networkSend(JSON.stringify({ type: "broadcast_reply", data: state.items }));
        // console.log("sended:", state.items);
    }, [state.epoch]);

    return (
        <div className="container">
            <div className="row">
                <div className="col my-3 px-3 py-3">
                    <h1>
                        <a href="https://vk.cc/c5wHT0">Список дел</a>
                    </h1>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col-11">
                    <div className="input-group">
                        <input className="form-control" type="text" value={Input} onChange={InputChange} />
                    </div>
                </div>

                <div className="col-1">
                    <button type="button" className="btn btn-primary" onClick={() => { processAction(addQuery(Input)) }}>
                        +
                    </button>
                </div>
            </div>
            <div>
                {printItems()}
            </div>
            <div>
                {networkState}
            </div>
        </div>
    );
}