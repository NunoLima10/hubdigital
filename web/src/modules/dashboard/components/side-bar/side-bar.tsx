import { useState } from "react";
import { Menu } from "lucide-react";
import { Profile } from "../profile/profile";
import { DashboardNav } from "../navbar/navbar";

export function SideBar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border p-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between">
        <Profile />
        <button
          className="rounded p-2 hover:bg-muted lg:hidden"
          aria-label="Alternar navegação"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Menu className="size-4" />
        </button>
      </div>
      <div className={`${open ? "block" : "hidden"} mt-5 lg:block`}>
        <DashboardNav />
      </div>
    </div>
  );
}
