"use client";

import { Navbar, NavbarContent, NavbarItem, Link } from "@nextui-org/react";

export default function Navigation() {
  return (
    <>
      <Navbar>
        <NavbarContent className="">
          <NavbarItem>
            <Link color="foreground" href="/audio">
              Audio
            </Link>
          </NavbarItem>
          <NavbarItem isActive>
            <Link aria-current="page" href="/form">
              Form
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/stock">
              Stock
            </Link>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    </>
  );
}
