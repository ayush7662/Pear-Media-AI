function Button({ text, onClick, disabled, loading, type = "button" }) {
  return (
    <button
      type={type}
      className="btn"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {loading ? "Please wait…" : text}
    </button>
  );
}

export default Button;
