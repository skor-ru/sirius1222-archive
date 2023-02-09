import image from "next/image";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { isTokenKind } from "typescript";

export type char = {pos:number, val:string, del:boolean,};
export type MyState = { chars:char[], epoch: number, };
export type insertAction = { type: "add", pos:number, id:number};
export type eraseAction = { type: "del", pos:number, id:number};
export type requestAction = { type: "broadcast_req", };
export type replyAction = { type: "broadcast_reply", data: Set<char>,};
export type MyAction = insertAction | eraseAction | requestAction | replyAction;

//export type MyReducer = (state: MyState, action: MyAction,) => MyState;
//export type MyDispatch = (action: MyAction,) => void;
const get_id = () => {
    return Math.floor(Math.random() * (1_000_000));
}
const get_time = () => {
    return (+new Date());
}
export default function main() {
    function inputReducer(Input: string, action: string): string {
        let newState = action;
        return newState;
    }
    function delQuery(id: number): eraseAction {
        return { type: "del", id:id };
    }
    function addQuery(text: string,): insertAction {
        return { type: "add", text: text, UUID: get_id(), time: get_time() };
    }
    

    function reducer(state: MyState, action: MyAction): MyState {
        let newState: MyState = JSON.parse(JSON.stringify(state));
        switch (action.type) {
            case "add":
               
                break;
            case "del":
              
                break;
            case "broadcast_req":
                newState.epoch++;
                break;
            case "broadcast_reply":
               
                break;
        }

        return newState;
    }
    
   
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = event.target.value;
        let l_ind:number = 0, r_ind:number = 0;
        while (newVal[l_ind] == state.chars[l_ind].val) 
            ++l_ind;
        while (newVal.at(-r_ind) == state.chars.at(-r_ind).val)
            ++r_ind;
        let
        if (newVal.length > state.chars.size) {
            dispatch(addQuery())
        } else {

        }
    };

    const [state, dispatch] = useReducer(reducer, {chars:new Set([]), epoch:0});
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
                        <a href="https://vk.cc/c5wHT0">Text redactor</a>
                    </h1>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col-11">
                    <div className="input-group">
                        <input className="form-control" type="text" value={Input} onChange={InputChange} />
                    </div>
                </div>
            </div>
        </div>
    );
}