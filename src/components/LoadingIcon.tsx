export default function LoadingIcon() {
  return (
    <div className="loading-container">
      <div className="stage">
        <div className="loader">
          <div className="logo-layer logo-dim"></div>
          <div className="logo-layer logo-lit"></div>
          <div className="charge-mask"><div className="band"></div></div>
        </div>
        <div className="loading-label">Loading…</div>
      </div>
    </div>
  );
}
