import NavLink from "./NavLink";

export default function CenteredNavbar() {
  return (
    <div className="flex justify-center absolute top-[166px] w-full z-50">
      <div
        className="relative w-[300px] h-[35px] rounded-xl"
        style={{
          background: "linear-gradient(to right, #FF1CF7, #00F0FF)",
          padding: "2px",
        }}
      >
        <div className="w-full h-full rounded-xl flex overflow-hidden">
          <NavLink name="audio" href="/audio" position="left" />
          <NavLink name="form" href="/form" position="center" />
          <NavLink name="stock" href="/stock" position="right" />
        </div>
      </div>
    </div>
  );
}
