"use client";

import Link from "next/link";
import Logo from "./Logo";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();

        if (pathname === "/") {
            const section = document.getElementById(targetId);
            if (section) {
                const navHeight = 80;
                const offsetPosition = section.offsetTop - navHeight;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
                history.replaceState(null, "", "/");
            }
        } else {
            router.push(`/#${targetId}`);
        }
    };

    return (
        <nav>
            <div className="nav-logo" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => router.push("/")}>
                <Logo style={{ width: "16px", height: "16px" }} />
                <div>
                    NEXUM <span>/ ERC-8183</span>
                </div>
            </div>
            <ul className="nav-links">
                <li>
                    <a href="/#how" onClick={(e) => handleScroll(e, "how")}>Protocol</a>
                </li>
                <li>
                    <a href="/#agents" onClick={(e) => handleScroll(e, "agents")}>Agents</a>
                </li>
                <li>
                    <a href="/#jobs" onClick={(e) => handleScroll(e, "jobs")}>Live Jobs</a>
                </li>
                <li>
                    <Link href="/docs">Docs</Link>
                </li>
            </ul>
            <ConnectButton />
        </nav >
    );
}
