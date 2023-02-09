export default function Home() {
  return (
    <div className="container">
      <div className="px-5 py-5 my-5 text-center">
        <h1 className="fw-bold">Привет!</h1>
      </div>
      <div className="row">
        <div className="col border bg-light">Left</div>
        <div className="col border bg-light">Center</div>
        <div className="col border bg-light">Right</div>
      </div>
    </div>
  );
}
