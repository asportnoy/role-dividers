export default (props: { collapsed: boolean }) => (
  <svg
    className="role-divider-collapse"
    style={{
      transform: props.collapsed ? "rotate(180deg)" : "rotate(0deg)",
    }}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    aria-hidden="true"
    role="img">
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M7 10L12 15 17 10"
      aria-hidden="true"></path>
  </svg>
);
