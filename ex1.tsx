import { FC, ReactNode } from "react";

type RenderIfProps = {
  cond: boolean;
  children: ReactNode;
};

export const RenderIf: FC<RenderIfProps> = ({ cond, children }) => {
  // TODO: Реализуй меня.
  if (cond)
    return <>{children}</>;
  return <></>;
};

type RenderListProps = {
  values: string[];
};

export const RenderList: FC<RenderListProps> = ({ values }) => {
  // TODO: Реализуй меня.
  let strs = [];
  for (let i = 0; i < values.length; ++i) {
    strs.push(<li>{values[i]}</li>)
  }
  return (
    <ul>
    {strs}  
    </ul>
  );
};

export default function Ex1() {
  console.log("Выполняем Ex1");
  return (
    <div className="container">
      <div className="row">
        <div className="col my-3 px-3 py-3">
          <h1>Основы отображения в React</h1>
        </div>
      </div>
      <div className="row">
        <RenderIf cond={true}>
          <p>Меня видно</p>
        </RenderIf>
      </div>
      <div className="row">
        <RenderIf cond={false}>
          <p>Я скрыт</p>
        </RenderIf>
      </div>
      <div className="row">
        <RenderList values={["мир", "труд", "капитал"]} />
      </div>
    </div>
  );
}
