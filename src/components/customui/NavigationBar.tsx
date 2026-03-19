import { Link, useLocation } from "react-router-dom";
import { CircleUser, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import UserDropdownPanel from "./UserDropdownPanel"; // adjust path if needed

const NavigationBar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-muted px-4 md:px-6">
      {/* Main nav links */}
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-base lg:gap-6">
        <Link
          to="/"
          className={`transition-colors hover:text-foreground ${
            isActive("/") ? "font-bold" : "text-foreground"
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/orders"
          className={`transition-colors hover:text-foreground ${
            isActive("/orders") ? "font-bold" : "text-foreground"
          }`}
        >
          Orders
        </Link>
        <Link
          to="/parts"
          className={`transition-colors hover:text-foreground ${
            isActive("/parts") ? "font-bold" : "text-foreground"
          }`}
        >
          Parts
        </Link>
        <Link
          to="/storage"
          className={`transition-colors hover:text-foreground ${
            isActive("/storage") ? "font-bold" : "text-foreground"
          }`}
        >
          Storage
        </Link>
        <Link
          to="/machine"
          className={`transition-colors hover:text-foreground ${
            isActive("/machine") ? "font-bold" : "text-foreground"
          }`}
        >
          Machine
        </Link>
        <Link
          to="/project"
          className={`transition-colors hover:text-foreground ${
            isActive("/project") ? "font-bold" : "text-foreground"
          }`}
        >
          Project
        </Link>
        <Link
          to="/management"
          className={`transition-colors whitespace-nowrap hover:text-foreground ${
            isActive("/management") ? "font-bold" : "text-foreground"
          }`}
        >
          Management
        </Link>
      </nav>

      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg">
            <Link
              to="/"
              className={`hover:text-foreground ${
                isActive("/") ? "font-bold" : "text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/orders"
              className={`hover:text-foreground ${
                isActive("/orders") ? "font-bold" : "text-foreground"
              }`}
            >
              Orders
            </Link>
            <Link
              to="/parts"
              className={`hover:text-foreground ${
                isActive("/parts") ? "font-bold" : "text-foreground"
              }`}
            >
              Parts
            </Link>
            <Link
              to="/storage"
              className={`hover:text-foreground ${
                isActive("/storage") ? "font-bold" : "text-foreground"
              }`}
            >
              Storage
            </Link>
            <Link
              to="/machine"
              className={`hover:text-foreground ${
                isActive("/machine") ? "font-bold" : "text-foreground"
              }`}
            >
              Machine
            </Link>
            <Link
              to="/project"
              className={`transition-colors hover:text-foreground ${
                isActive("/project") ? "font-bold" : "text-foreground"
              }`}
            >
              Project
            </Link>
            <Link
              to="/management"
              className={`transition-colors whitespace-nowrap hover:text-foreground ${
                isActive("/management") ? "font-bold" : "text-foreground"
              }`}
            >
              Management
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Profile dropdown */}
      <div className="flex justify-end w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-0">
            <UserDropdownPanel />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default NavigationBar;
